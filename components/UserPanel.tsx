/**
 * 用户面板 - 重构版本（使用子组件和Hooks）
 */
import React, { useState, useEffect } from 'react';
import { User, ModelType, GeneratedImageResult } from '../types';
import { useMasks } from '../contexts/MaskContext';
import { useGeneration } from '../contexts/GenerationContext';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useImageDownload } from '../hooks/useImageDownload';
import { useSelection } from '../hooks/useSelection';
import { MaskSelector } from './user/MaskSelector';
import { ImageUploader } from './user/ImageUploader';
import { ProductSpecsForm } from './user/ProductSpecsForm';
import { ModelSelector } from './user/ModelSelector';
import { GenerateButton } from './user/GenerateButton';
import { ImageGallery } from './user/ImageGallery';
import { BatchDownloadBar } from './user/BatchDownloadBar';
import { ImageDetailModal } from './user/ImageDetailModal';

interface UserPanelProps {
  currentUser: User;
}

export const UserPanel: React.FC<UserPanelProps> = ({ currentUser }) => {
  const { masks, getMaskById } = useMasks();
  const { results, addResult, updateResult, saveToHistory, loadHistory } = useGeneration();
  const {
    isProcessingBg,
    isGenerating,
    sourceImages,
    handleFilesUpload,
    removeImage,
    generateBatch,
    generateImage,
  } = useImageGeneration();
  const { downloadBatch } = useImageDownload();

  // 状态管理
  const [selectedMaskId, setSelectedMaskId] = useState<string>('');
  const [selectedImageModel, setSelectedImageModel] = useState<ModelType>(ModelType.GEMINI_FLASH_IMAGE);
  const [productSize, setProductSize] = useState('');
  const [appScenario, setAppScenario] = useState('');
  const [productCaliber, setProductCaliber] = useState('');
  const [defSearchTerm, setDefSearchTerm] = useState('');
  const [viewingResult, setViewingResult] = useState<GeneratedImageResult | null>(null);

  // 使用useSelection管理选择状态
  const selectedMask = masks.find(m => m.id === selectedMaskId);
  const definitions = selectedMask?.definitions || [];
  const definitionSelection = useSelection(definitions);
  const resultSelection = useSelection(results);

  // 初始化：选择第一个面具，并加载历史记录
  useEffect(() => {
    if (masks.length > 0 && !selectedMaskId) {
      setSelectedMaskId(masks[0].id);
    }
  }, [masks, selectedMaskId]);

  // 页面加载时加载历史记录（只在生成器页面）
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 切换面具时重置选择
  useEffect(() => {
    definitionSelection.deselectAll();
    setDefSearchTerm('');
  }, [selectedMaskId]);

  // 自动保存到历史
  useEffect(() => {
    const saveCompletedResults = async () => {
      const completedResults = results.filter(
        r => r.imageUrl && !r.loading && !r.savedToBackend
      );

      for (const result of completedResults) {
        await saveToHistory(result);
      }
    };

    if (results.length > 0) {
      saveCompletedResults();
    }
  }, [results, saveToHistory]);

  // 处理文件上传（多文件）
  const handleFilesSelect = async (files: File[]) => {
    try {
      await handleFilesUpload(files);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  // 处理图片删除
  const handleImageDelete = (imageId: string) => {
    removeImage(imageId);
  };

  // 处理生成（使用所有上传的图片）
  const handleGenerate = async () => {
    if (!selectedMask || sourceImages.length === 0 || definitionSelection.count === 0) {
      alert('请至少上传一张产品图并选择一个要生成的镜头场景！');
      return;
    }

    if (!productSize.trim()) {
      alert('请填写产品尺寸！');
      return;
    }

    const definitionsToRun = definitionSelection.selectedItems;
    const validImages = sourceImages.filter(img => !img.processing);

    // 为每张图片和每个镜头定义生成结果
    for (const sourceImg of validImages) {
      const newResults = await generateBatch(
        definitionsToRun,
        sourceImg.url,
        selectedImageModel,
        productSize,
        appScenario,
        productCaliber
      );

      // 添加到结果列表
      newResults.forEach(result => addResult(result));
    }
  };

  // 处理重新生成
  const handleRegenerate = async (
    sourceResult: GeneratedImageResult,
    refinePrompt?: string,
    model?: ModelType
  ) => {
    const effectiveSourceImage = sourceResult.imageUrl || sourceResult.sourceImage;
    if (!effectiveSourceImage) {
      alert('无法重试：缺少原始图片');
      return;
    }

    const mask = getMaskById(sourceResult.definitionId);
    if (!mask) {
      console.error('Mask not found');
      return;
    }

    const def = mask.definitions.find(d => d.id === sourceResult.definitionId);
    if (!def) return;

    const newResult = await generateImage(
      def,
      effectiveSourceImage,
      model || selectedImageModel,
      productSize,
      appScenario,
      productCaliber,
      refinePrompt
    );

    addResult(newResult);
  };

  // 处理重试
  const handleRetry = async (failedResult: GeneratedImageResult) => {
    if (!failedResult.sourceImage) {
      alert('无法重试：缺少原始图片');
      return;
    }

    const mask = getMaskById(failedResult.definitionId);
    if (!mask) return;

    const def = mask.definitions.find(d => d.id === failedResult.definitionId);
    if (!def) return;

    updateResult(failedResult.id, {
      loading: true,
      error: undefined,
      step: 'generating',
    });

    const newResult = await generateImage(
      def,
      failedResult.sourceImage,
      failedResult.model || selectedImageModel,
      productSize,
      appScenario,
      productCaliber
    );

    updateResult(failedResult.id, {
      ...newResult,
      savedToBackend: false,
    });
  };

  // 处理批量下载
  const handleBatchDownload = async () => {
    const selectedResults = resultSelection.selectedItems;
    if (selectedResults.length === 0) return;

    try {
      await downloadBatch(selectedResults);
      resultSelection.deselectAll();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 获取面具名称
  const getMaskName = (definitionId: string): string => {
    const mask = masks.find(m => m.definitions.some(d => d.id === definitionId));
    return mask?.name || 'Unknown';
  };

  // 过滤定义（基于搜索）
  const filteredDefinitions = definitions.filter(d =>
    !defSearchTerm.trim() || d.name.toLowerCase().includes(defSearchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* Detail Modal */}
      {viewingResult && (
        <ImageDetailModal
          result={viewingResult}
          maskName={getMaskName(viewingResult.definitionId)}
          onClose={() => setViewingResult(null)}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* LEFT: Controls & Input */}
      <div className="w-[320px] min-w-[300px] border-r border-gray-200 flex flex-col bg-gray-50 z-10 shadow-lg h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {/* Header */}
          {/* <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">AmazonGen</h1>
            <p className="text-gray-500 text-xs mt-0.5">自动化产品摄影生成套件</p>
          </div> */}

          {/* Mask Selector */}
          {masks.length > 0 && (
            <MaskSelector
              masks={masks}
              selectedMaskId={selectedMaskId}
              selectedDefinitionIds={new Set(definitionSelection.selectedItems.map(d => d.id))}
              onMaskChange={setSelectedMaskId}
              onDefinitionToggle={(id) => {
                const def = definitions.find(d => d.id === id);
                if (def) {
                  if (definitionSelection.isSelected(id)) {
                    definitionSelection.deselect(id);
                  } else {
                    definitionSelection.select(id);
                  }
                }
              }}
              searchTerm={defSearchTerm}
              onSearchChange={setDefSearchTerm}
            />
          )}

          {/* Image Uploader */}
          <ImageUploader
            sourceImages={sourceImages}
            isProcessing={isGenerating}
            onFilesSelect={handleFilesSelect}
            onImageDelete={handleImageDelete}
          />

          {/* Product Specs Form */}
          {sourceImages.length > 0 && (
            <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200">
              <ProductSpecsForm
                productSize={productSize}
                appScenario={appScenario}
                productCaliber={productCaliber}
                onSizeChange={setProductSize}
                onScenarioChange={setAppScenario}
                onCaliberChange={setProductCaliber}
              />
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Area */}
        <div className="p-3 border-t border-gray-200 bg-white space-y-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <ModelSelector selectedModel={selectedImageModel} onModelChange={setSelectedImageModel} />

          <GenerateButton
            disabled={
              sourceImages.length === 0 ||
              sourceImages.some(img => img.processing) ||
              isGenerating ||
              isProcessingBg ||
              !selectedMask ||
              definitionSelection.count === 0 ||
              !productSize.trim()
            }
            isLoading={isGenerating}
            selectedCount={definitionSelection.count}
            onClick={handleGenerate}
          />
        </div>
      </div>

      {/* RIGHT: Preview Gallery */}
      <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative">
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm flex items-center gap-4 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">生成结果</h2>
            <p className="text-xs text-gray-500">
              {results.length > 0 ? `共 ${results.length} 张` : '等待生成...'}
            </p>
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <ImageGallery
            results={results}
            masks={masks}
            selectedResultIds={new Set(resultSelection.selectedItems.map(r => r.id))}
            onResultToggle={(id) => {
              if (resultSelection.isSelected(id)) {
                resultSelection.deselect(id);
              } else {
                resultSelection.select(id);
              }
            }}
            onViewDetail={setViewingResult}
            onRetry={handleRetry}
          />
        </div>

        {/* Floating Batch Action Bar */}
        <BatchDownloadBar
          selectedCount={resultSelection.count}
          onDownload={handleBatchDownload}
          onClear={resultSelection.deselectAll}
        />
      </div>
    </div>
  );
};
