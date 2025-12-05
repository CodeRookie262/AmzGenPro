
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Zap, Loader2, Download, Image as ImageIcon, AlertCircle, Wand2, FileText } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = getMasks();
    setMasks(loaded);
    if (loaded.length > 0) setSelectedMaskId(loaded[0].id);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setSourceImage(null);
    setResults([]);
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

  const handleGenerate = async () => {
    const mask = masks.find(m => m.id === selectedMaskId);
    if (!mask || !sourceImage) return;

    // Check if key selection is needed for Pro Image model
    if (selectedImageModel === ModelType.GEMINI_PRO_IMAGE) {
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          console.error("Key selection failed/cancelled", e);
          return;
        }
      }
    }

    setIsGenerating(true);
    
    const initialResults: GeneratedImageResult[] = mask.definitions.map(def => ({
      definitionId: def.id,
      definitionName: def.name,
      imageUrl: null,
      loading: true,
      step: 'optimizing'
    }));
    setResults(initialResults);

    // Execute generation pipeline for each definition
    // We do this in parallel, but you might want to limit concurrency in production
    const promises = mask.definitions.map(async (def) => {
      try {
        // Step 1: Optimize Prompt (Text Model)
        // Using the model configured in the MASK
        const optimizedPrompt = await optimizePrompt(sourceImage, def.prompt, mask.promptModel);
        
        setResults(prev => prev.map(r => 
          r.definitionId === def.id ? { ...r, optimizedPrompt, step: 'generating' } : r
        ));

        // Step 2: Generate Image (Image Model)
        // Using the model selected by the USER
        const imageUrl = await generateImageFromProduct(sourceImage, optimizedPrompt, selectedImageModel);
        
        setResults(prev => prev.map(r => 
          r.definitionId === def.id ? { ...r, imageUrl, loading: false, step: undefined } : r
        ));

      } catch (error) {
        console.error(`Failed generation for ${def.name}`, error);
        setResults(prev => prev.map(r => 
          r.definitionId === def.id ? { ...r, error: "生成失败: " + (error instanceof Error ? error.message : "未知错误"), loading: false } : r
        ));
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

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

          {/* 1. Mask Selection */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">1. 选择产品面具 (Product Mask)</label>
            <div className="relative mb-3">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-orange-500"
                value={selectedMaskId}
                onChange={(e) => {
                  setSelectedMaskId(e.target.value);
                  setResults([]);
                }}
              >
                {masks.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {selectedMask && (
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                   <span className="font-semibold text-blue-700">优化模型:</span>
                   <span className="text-blue-900">{selectedMask.promptModel}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMask.definitions.map(d => (
                    <span key={d.id} className="px-2 py-0.5 bg-white border border-blue-200 rounded-full">{d.name}</span>
                  ))}
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
                <option value={ModelType.GEMINI_FLASH_IMAGE}>Gemini 2.5 Flash Image (快速/稳定)</option>
                <option value={ModelType.GEMINI_PRO_IMAGE}>Gemini 3 Pro Image (高清/需付费Key)</option>
              </select>
          </div>

          {/* 4. Action */}
          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating || isProcessingBg || !selectedMask}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-md transition-all
              ${!sourceImage || isGenerating || isProcessingBg
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg'
              }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 生成套图中...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" /> 开始生成
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
            <p className="text-xs text-gray-500">{results.length > 0 ? `包含 ${results.length} 张场景图` : '等待生成...'}</p>
          </div>
          {results.some(r => r.imageUrl) && (
            <button className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
              <Download className="w-4 h-4" /> 全部下载
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
               <p className="text-sm">左侧配置完成后，点击“开始生成”</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((result) => (
                <div key={result.definitionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-700">{result.definitionName}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {result.loading ? (result.step === 'optimizing' ? '优化 Prompt...' : '正在绘图...') : '完成'}
                    </span>
                  </div>
                  
                  {/* Image Area */}
                  <div className="aspect-square relative bg-gray-100 flex items-center justify-center group">
                    {result.loading ? (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                        <span className="text-xs text-gray-500 font-medium">
                          {result.step === 'optimizing' ? '正在编写光影与细节...' : '正在渲染最终图片...'}
                        </span>
                        {result.step === 'generating' && (
                           <div className="text-[10px] text-gray-400 mt-2 max-h-20 overflow-hidden text-ellipsis px-4">
                             Prompt 已就绪
                           </div>
                        )}
                      </div>
                    ) : result.error ? (
                      <div className="flex flex-col items-center gap-2 text-red-400 px-4 text-center">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs">{result.error}</span>
                      </div>
                    ) : result.imageUrl ? (
                      <>
                        <img src={result.imageUrl} alt={result.definitionName} className="w-full h-full object-contain" />
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                          <a 
                            href={result.imageUrl} 
                            download={`amazongen-${result.definitionName}.png`}
                            className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium text-sm shadow-lg hover:bg-orange-50 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all"
                          >
                            <Download className="w-4 h-4" /> 下载图片
                          </a>
                          
                          {/* Prompt Peek */}
                          <div className="group/prompt relative">
                             <button className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
                               <FileText className="w-3 h-3" /> 查看 Prompt
                             </button>
                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-black text-white text-xs rounded shadow-xl hidden group-hover/prompt:block z-20 max-h-48 overflow-y-auto">
                               {result.optimizedPrompt}
                             </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
