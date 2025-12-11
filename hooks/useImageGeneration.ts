/**
 * 图片生成Hook - 封装图片生成相关逻辑
 */
import { useState, useCallback } from 'react';
import { ModelType, GeneratedImageResult, ImageDefinition } from '../types';
import { generateImageFromProduct, removeBackground } from '../services/geminiService';
import { readFileAsBase64 } from '../utils/file';
import { generateId } from '../utils/format';

interface UseImageGenerationOptions {
  onSuccess?: (result: GeneratedImageResult) => void;
  onError?: (error: Error) => void;
}

export interface SourceImage {
  id: string;
  url: string;
  processing?: boolean;
}

export const useImageGeneration = (options: UseImageGenerationOptions = {}) => {
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);

  /**
   * 处理文件上传和背景移除（多文件）
   */
  const handleFilesUpload = useCallback(async (files: File[]): Promise<SourceImage[]> => {
    setIsProcessingBg(true);
    const newImages: SourceImage[] = [];

    try {
      // 先添加所有图片为处理中状态
      const processingImages = files.map(file => ({
        id: generateId(),
        url: URL.createObjectURL(file), // 临时预览
        processing: true,
      }));
      setSourceImages(prev => [...prev, ...processingImages]);

      // 逐个处理背景移除
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const processingImage = processingImages[i];
        
        try {
          const base64 = await readFileAsBase64(file);
          const processedImage = await removeBackground(base64);
          
          // 更新对应图片
          setSourceImages(prev =>
            prev.map(img =>
              img.id === processingImage.id
                ? { ...img, url: processedImage, processing: false }
                : img
            )
          );
          
          newImages.push({
            id: processingImage.id,
            url: processedImage,
            processing: false,
          });
        } catch (error) {
          console.error('Background removal failed for file', file.name, error);
          const base64 = await readFileAsBase64(file);
          
          // 更新为原图
          setSourceImages(prev =>
            prev.map(img =>
              img.id === processingImage.id
                ? { ...img, url: base64, processing: false }
                : img
            )
          );
          
          newImages.push({
            id: processingImage.id,
            url: base64,
            processing: false,
          });
        }
      }

      return newImages;
    } finally {
      setIsProcessingBg(false);
    }
  }, []);

  /**
   * 删除图片
   */
  const removeImage = useCallback((imageId: string) => {
    setSourceImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  /**
   * 清空所有图片
   */
  const clearImages = useCallback(() => {
    setSourceImages([]);
  }, []);

  /**
   * 构建最终提示词
   */
  const buildPrompt = useCallback((
    definition: ImageDefinition,
    productSize?: string,
    appScenario?: string,
    productCaliber?: string,
    refinePrompt?: string
  ): string => {
    const baseInstruction = definition.prompt;
    let finalPrompt = `[System Instruction / Role Definition]\n${baseInstruction}\n\n[Target Specifications]`;
    
    if (productSize?.trim()) {
      finalPrompt += `\n- Product Size: ${productSize.trim()}`;
    }
    
    if (appScenario?.trim()) {
      finalPrompt += `\n- Application Scenario: ${appScenario.trim()}`;
    }
    
    if (productCaliber?.trim()) {
      finalPrompt += `\n- Product Caliber/Spec: ${productCaliber.trim()}`;
    }
    
    if (refinePrompt?.trim()) {
      finalPrompt += `\n\n[User Refinement Instruction]\n${refinePrompt.trim()}`;
    }
    
    finalPrompt += `\n\n[Execution Command]\nBased on the visual analysis of the attached input image (which might be a previous generation) and the specifications above, generate the final scene image. Do not output conversational text. Output ONLY the image.`;
    
    return finalPrompt;
  }, []);

  /**
   * 生成单张图片
   */
  const generateImage = useCallback(async (
    definition: ImageDefinition,
    sourceImageBase64: string,
    model: ModelType,
    productSize?: string,
    appScenario?: string,
    productCaliber?: string,
    refinePrompt?: string
  ): Promise<GeneratedImageResult> => {
    const taskId = generateId();
    const finalPrompt = buildPrompt(
      definition,
      productSize,
      appScenario,
      productCaliber,
      refinePrompt
    );

    const task: GeneratedImageResult = {
      id: taskId,
      definitionId: definition.id,
      definitionName: definition.name,
      imageUrl: null,
      loading: true,
      step: 'generating',
      timestamp: Date.now(),
      sourceImage: sourceImageBase64,
      model,
      optimizedPrompt: finalPrompt,
    };

    try {
      const imageRes = await generateImageFromProduct(sourceImageBase64, finalPrompt, model);
      const imageUrl = imageRes.data.imageUrl;
      
      const result: GeneratedImageResult = {
        ...task,
        imageUrl,
        loading: false,
        step: undefined,
      };

      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorResult: GeneratedImageResult = {
        ...task,
        loading: false,
        error: error instanceof Error ? error.message : '生成失败',
      };
      options.onError?.(error instanceof Error ? error : new Error('生成失败'));
      return errorResult;
    }
  }, [buildPrompt, options]);

  /**
   * 批量生成图片
   */
  const generateBatch = useCallback(async (
    definitions: ImageDefinition[],
    sourceImageBase64: string,
    model: ModelType,
    productSize?: string,
    appScenario?: string,
    productCaliber?: string
  ): Promise<GeneratedImageResult[]> => {
    setIsGenerating(true);
    const results: GeneratedImageResult[] = [];

    try {
      const promises = definitions.map(def =>
        generateImage(
          def,
          sourceImageBase64,
          model,
          productSize,
          appScenario,
          productCaliber
        )
      );

      const settledResults = await Promise.allSettled(promises);
      
      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const errorResult: GeneratedImageResult = {
            id: generateId(),
            definitionId: definitions[index].id,
            definitionName: definitions[index].name,
            imageUrl: null,
            loading: false,
            error: result.reason?.message || '生成失败',
            timestamp: Date.now(),
            sourceImage: sourceImageBase64,
            model,
          };
          results.push(errorResult);
        }
      });

      return results;
    } finally {
      setIsGenerating(false);
    }
  }, [generateImage]);

  // 保持向后兼容：返回第一张图片
  const sourceImage = sourceImages.length > 0 ? sourceImages[0].url : null;

  return {
    isProcessingBg,
    isGenerating,
    sourceImage, // 向后兼容
    sourceImages, // 新增：多图支持
    setSourceImages,
    handleFilesUpload, // 新增：多文件上传
    handleFileUpload: async (file: File) => {
      const results = await handleFilesUpload([file]);
      return results[0]?.url || '';
    }, // 向后兼容
    removeImage, // 新增：删除图片
    clearImages, // 新增：清空图片
    generateImage,
    generateBatch,
  };
};

