
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Zap, Loader2, Download, Image as ImageIcon, AlertCircle, Wand2, FileText, CheckCircle, Copy, CheckSquare, Square } from 'lucide-react';
import { ProductMask, GeneratedImageResult, ModelType } from '../types';
import { getMasks } from '../services/storageService';
import { generateImageFromProduct, removeBackground, optimizePrompt } from '../services/geminiService';

export const UserPanel: React.FC = () => {
  const [masks, setMasks] = useState<ProductMask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string>('');
  
  // New: Image Generation Model Selection
  const [selectedImageModel, setSelectedImageModel] = useState<ModelType>(ModelType.GEMINI_FLASH_IMAGE);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImageResult[]>([]);
  
  // Selection state for definitions
  const [selectedDefIds, setSelectedDefIds] = useState<Set<string>>(new Set());
  
  // Multi-select for download
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = getMasks();
    setMasks(loaded);
    if (loaded.length > 0) {
      setSelectedMaskId(loaded[0].id);
      setSelectedDefIds(new Set());
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only reset source image, NOT results history
    setSourceImage(null); 
    setIsProcessingBg(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      
      try {
        const processedImage = await removeBackground(rawBase64);
        setSourceImage(processedImage);
      } catch (error) {
        console.error("Auto background removal failed, using original", error);
        setSourceImage(rawBase64);
      } finally {
        setIsProcessingBg(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleDefinitionSelection = (defId: string) => {
    const newSelection = new Set(selectedDefIds);
    if (newSelection.has(defId)) {
      newSelection.delete(defId);
    } else {
      newSelection.add(defId);
    }
    setSelectedDefIds(newSelection);
  };

  const toggleResultSelection = (resultId: string) => {
    const newSelection = new Set(selectedResultIds);
    if (newSelection.has(resultId)) {
      newSelection.delete(resultId);
    } else {
      newSelection.add(resultId);
    }
    setSelectedResultIds(newSelection);
  };

  const handleBatchDownload = () => {
    const selectedResults = results.filter(r => selectedResultIds.has(r.id) && r.imageUrl);
    selectedResults.forEach((result) => {
      if (result.imageUrl) {
        const link = document.createElement('a');
        link.href = result.imageUrl;
        link.download = `amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
    setSelectedResultIds(new Set()); // Optional: clear selection after download
  };

  const handleGenerate = async () => {
    const mask = masks.find(m => m.id === selectedMaskId);
    if (!mask || !sourceImage) return;

    const definitionsToRun = mask.definitions.filter(def => selectedDefIds.has(def.id));
    
    if (definitionsToRun.length === 0) {
      alert("请至少选择一个要生成的镜头场景！");
      return;
    }

    setIsGenerating(true);
    
    const newTasks: GeneratedImageResult[] = definitionsToRun.map(def => ({
      id: crypto.randomUUID(), 
      definitionId: def.id,
      definitionName: def.name,
      imageUrl: null, 
      loading: true,
      step: 'optimizing',
      timestamp: Date.now(),
      sourceImage: sourceImage, // Store current source
      model: selectedImageModel // Store current model
    }));

    setResults(prev => [...newTasks, ...prev]);

    const promises = newTasks.map(async (task) => {
      const def = mask.definitions.find(d => d.id === task.definitionId)!;

      try {
        const optimizedPromptRes = await optimizePrompt(sourceImage, def.prompt, mask.promptModel);
        const optimizedPrompt = optimizedPromptRes.data.content;
        
        setResults(prev => prev.map(r => 
          r.id === task.id ? { ...r, optimizedPrompt, step: 'generating' } : r
        ));

        const imageRes = await generateImageFromProduct(sourceImage, optimizedPrompt, selectedImageModel);
        const imageUrl = imageRes.data.imageUrl;
        
        setResults(prev => prev.map(r => 
          r.id === task.id ? { ...r, imageUrl, loading: false, step: undefined } : r
        ));

      } catch (error) {
        console.error(`Failed generation for ${def.name}`, error);
        setResults(prev => prev.map(r => 
          r.id === task.id ? { ...r, error: "生成失败: " + (error instanceof Error ? error.message : "未知错误"), loading: false } : r
        ));
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

  useEffect(() => {
    setSelectedDefIds(new Set());
  }, [selectedMaskId]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* LEFT: Controls & Input */}
      <div className="w-1/3 min-w-[350px] border-r border-gray-200 flex flex-col bg-gray-50 z-10 shadow-lg">
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AmazonGen</h1>
            <p className="text-gray-500 text-sm">自动化产品摄影生成套件</p>
          </div>

          {/* 1. Mask Selection & Definition Toggle */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">1. 选择产品面具 (Product Mask)</label>
            <div className="relative mb-3">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-orange-500"
                value={selectedMaskId}
                onChange={(e) => setSelectedMaskId(e.target.value)}
              >
                {masks.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {selectedMask && (
              <div className="flex flex-col gap-2 mt-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">选择要生成的镜头:</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedMask.definitions.map(d => {
                    const isSelected = selectedDefIds.has(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDefinitionSelection(d.id)}
                        className={`px-3 py-2 text-xs rounded-md border flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate mr-2">{d.name}</span>
                        {isSelected && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-[10px] text-gray-400">已选 {selectedDefIds.size} 个场景</span>
                   <button 
                     onClick={() => {
                        if (selectedDefIds.size === selectedMask.definitions.length) {
                          setSelectedDefIds(new Set());
                        } else {
                          setSelectedDefIds(new Set(selectedMask.definitions.map(d => d.id)));
                        }
                     }}
                     className="text-[10px] text-blue-600 hover:text-blue-800 underline"
                   >
                     {selectedDefIds.size === selectedMask.definitions.length ? '取消全选' : '全选'}
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Upload */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <label className="block text-sm font-semibold text-gray-700 mb-2">2. 上传产品图片 (自动去底)</label>
             <div 
               className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative overflow-hidden ${sourceImage ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'}`}
               onClick={() => !isProcessingBg && fileInputRef.current?.click()}
             >
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleFileChange}
                 disabled={isProcessingBg}
               />
               
               {isProcessingBg ? (
                 <div className="py-8 flex flex-col items-center animate-pulse">
                    <Wand2 className="w-8 h-8 text-orange-500 mb-2 animate-bounce" />
                    <p className="text-sm font-medium text-orange-600">正在智能去白底...</p>
                 </div>
               ) : sourceImage ? (
                 <div className="relative w-full aspect-square max-h-48 overflow-hidden rounded-md group">
                   <img src={sourceImage} alt="Source" className="object-contain w-full h-full p-2 bg-white" />
                   <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow font-bold">
                     已去底
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     点击替换
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <Upload className="w-6 h-6 text-gray-500" />
                   </div>
                   <p className="text-sm text-gray-600 font-medium">点击上传产品图</p>
                 </>
               )}
             </div>
          </div>

          {/* 3. Image Generation Model Selection */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <label className="block text-sm font-semibold text-gray-700 mb-2">3. 选择生图模型</label>
             <select 
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                value={selectedImageModel}
                onChange={(e) => setSelectedImageModel(e.target.value as ModelType)}
              >
                <option value={ModelType.GEMINI_FLASH_IMAGE}>[Google] Gemini 2.5 Flash Image</option>
                <option value={ModelType.OR_GEMINI_3_IMAGE}>[OpenRouter] Gemini 3.0 Pro Image Preview</option>
                <option value={ModelType.OR_GEMINI_2_5_FLASH_IMAGE}>[OpenRouter] Gemini 2.5 Flash Image</option>
              </select>
          </div>

          {/* 4. Action */}
          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating || isProcessingBg || !selectedMask || selectedDefIds.size === 0}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-md transition-all
              ${!sourceImage || isGenerating || isProcessingBg || selectedDefIds.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg'
              }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 生成中 ({results.filter(r => r.loading).length}个任务)...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" /> 开始生成 ({selectedDefIds.size}张)
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Preview Gallery */}
      <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">生成结果</h2>
            <p className="text-xs text-gray-500">{results.length > 0 ? `共 ${results.length} 张` : '等待生成...'}</p>
          </div>
          {selectedResultIds.size > 0 && (
            <button 
              onClick={handleBatchDownload}
              className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200 flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> 下载选中 ({selectedResultIds.size})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                 <ImageIcon className="w-10 h-10 text-gray-300" />
               </div>
               <p className="text-lg font-medium">准备就绪</p>
               <p className="text-sm">请在左侧选择至少一个镜头并开始生成</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((result) => {
                const isSelected = selectedResultIds.has(result.id);
                return (
                  <div 
                    key={result.id} 
                    className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col relative transition-all ${isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'}`}
                  >
                    {/* Card Header with Source Image & Model Info */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {/* Mini Source Image */}
                        {result.sourceImage && (
                          <div className="w-8 h-8 rounded border border-gray-200 bg-white p-0.5 flex-shrink-0" title="Source Image">
                            <img src={result.sourceImage} className="w-full h-full object-contain" alt="source" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-gray-700 leading-tight">{result.definitionName}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {result.model?.split('/').pop() || 'Unknown'} • {new Date(result.timestamp || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                      
                      {/* Selection Checkbox */}
                      <button 
                        onClick={() => toggleResultSelection(result.id)}
                        className={`p-1 rounded-md transition-colors ${isSelected ? 'text-orange-500' : 'text-gray-300 hover:text-gray-500'}`}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Image Area */}
                    <div className="aspect-square relative bg-gray-100 flex items-center justify-center group">
                      
                      {/* Image Display */}
                      {result.imageUrl ? (
                          <>
                          <img src={result.imageUrl} alt={result.definitionName} className={`w-full h-full object-contain`} />
                          
                          {/* Tooltip Prompt - Anchored relative to button inside overlay */}
                          <div className="absolute bottom-3 right-3 z-20 group/prompt">
                             <button className="bg-gray-900/80 backdrop-blur text-white p-2 rounded-full hover:bg-black transition-colors shadow-lg">
                               <FileText className="w-4 h-4" />
                             </button>
                             
                             {/* Tooltip Content - Floating bubble */}
                             <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/prompt:opacity-100 transition-opacity pointer-events-none group-hover/prompt:pointer-events-auto z-30 max-h-60 overflow-y-auto custom-scrollbar">
                               <p className="font-mono leading-relaxed break-words">{result.optimizedPrompt}</p>
                               <div className="absolute -bottom-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                             </div>
                          </div>

                          {/* Overlay Actions (Download) */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={result.imageUrl} 
                              download={`amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`}
                              className="bg-white/90 backdrop-blur text-gray-700 p-2 rounded-full shadow-lg hover:text-orange-600 transition-colors flex"
                              title="下载原图"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                          </>
                      ) : null}

                      {/* Loading Layer */}
                      {result.loading && (
                        <div className={`flex flex-col items-center gap-2 p-4 text-center z-10 ${result.imageUrl ? 'absolute inset-0 justify-center bg-black/10' : ''}`}>
                          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                          <span className="text-xs font-medium text-gray-500">
                            {result.step === 'optimizing' ? '正在编写光影...' : '正在渲染图片...'}
                          </span>
                        </div>
                      )}

                      {/* Error Layer */}
                      {!result.loading && result.error && (
                        <div className="flex flex-col items-center gap-2 text-red-400 px-4 text-center">
                          <AlertCircle className="w-8 h-8" />
                          <span className="text-xs">{result.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
