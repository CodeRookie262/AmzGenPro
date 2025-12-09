
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Zap, Loader2, Download, Image as ImageIcon, AlertCircle, Wand2, FileText, CheckCircle, Copy, CheckSquare, Square, Search, X, Maximize2, Calendar, Layers, RefreshCw } from 'lucide-react';
import { ProductMask, GeneratedImageResult, ModelType, User } from '../types';
import { backendMasks, backendHistory } from '../services/backendService';
import { generateImageFromProduct, removeBackground, optimizePrompt } from '../services/geminiService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


// Image Detail Modal Component
const ImageDetailModal: React.FC<{ 
  result: GeneratedImageResult | null; 
  maskName?: string;
  onClose: () => void;
  onRegenerate: (result: GeneratedImageResult, refinePrompt?: string, model?: ModelType) => void;
}> = ({ result, maskName, onClose, onRegenerate }) => {
  const [refinePrompt, setRefinePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>((result?.model as ModelType) || ModelType.GEMINI_FLASH_IMAGE);

  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image */}
        <div className="w-2/3 bg-gray-100 flex items-center justify-center p-8 relative">
          <div className="pattern-grid absolute inset-0 opacity-5 pointer-events-none" />
          {result.imageUrl ? (
            <img src={result.imageUrl} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" alt="Generated" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>图片加载失败</p>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="w-1/3 p-6 overflow-y-auto bg-white flex flex-col h-full border-l border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{result.definitionName}</h2>
            <p className="text-gray-500 text-xs flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> {maskName || 'Unknown Mask'}
            </p>
          </div>

          {/* Source Image Comparison */}
          {result.sourceImage && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded border border-gray-200 p-1 shadow-sm flex-shrink-0">
                <img src={result.sourceImage} className="w-full h-full object-contain" alt="Original" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">关联原图 (Source)</span>
            </div>
          )}

          {/* Refine / Regenerate Section - Main Focus */}
          <div className="flex-1 min-h-0 mb-4 flex flex-col">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 block flex items-center justify-between">
              调整 / 重绘 (Refine)
              <span className="text-[10px] text-gray-400 font-normal">可选</span>
            </span>
            <div className="flex-1 flex flex-col gap-3">
              <textarea
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="在此输入新的调整指令（例如：背景再亮一点，产品放大一些...）&#10;留空则使用原参数重新生成。"
                className="w-full min-h-[150px] p-4 rounded-xl text-sm border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none bg-gray-50 placeholder:text-gray-400 leading-relaxed"
              />
              
              {/* Model Selection in Modal */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase">生成模型</label>
                 <div className="relative">
                    <Zap className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select 
                      className="w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                    >
                      <option value={ModelType.GEMINI_FLASH_IMAGE}>Gemini 2.5 Flash Image</option>
                      <option value={ModelType.OR_GEMINI_3_IMAGE}>Gemini 3.0 Pro Image</option>
                      <option value={ModelType.OR_GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash (OR)</option>
                    </select>
                 </div>
              </div>

              <button
                onClick={() => {
                  onRegenerate(result, refinePrompt, selectedModel);
                  onClose();
                }}
                className="w-full py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-bold text-sm transition-all hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> 生成新图片 (New Version)
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> 生成时间</span>
              <span className="font-medium">{new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 原始模型</span>
              <span className="font-medium truncate max-w-[150px]">{result.model}</span>
            </div>
            
            <a 
              href={result.imageUrl || '#'}
              download={`amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all ${
                result.imageUrl 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> 下载原图
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UserPanelProps {
  currentUser: User;
}

export const UserPanel: React.FC<UserPanelProps> = ({ currentUser }) => {
  const [masks, setMasks] = useState<ProductMask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string>('');
  
  // New: Image Generation Model Selection
  const [selectedImageModel, setSelectedImageModel] = useState<ModelType>(ModelType.GEMINI_FLASH_IMAGE);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [productSize, setProductSize] = useState('');
  const [productWidth, setProductWidth] = useState('');
  const [productHeight, setProductHeight] = useState('');
  const [appScenario, setAppScenario] = useState('');
  const [productCaliber, setProductCaliber] = useState('');

  const [isProcessingBg, setIsProcessingBg] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImageResult[]>([]);
  
  // Selection state for definitions
  const [selectedDefIds, setSelectedDefIds] = useState<Set<string>>(new Set());
  
  // Multi-select for download
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  
  // Definition Search
  const [defSearchTerm, setDefSearchTerm] = useState('');
  
  // Modal State
  const [viewingResult, setViewingResult] = useState<GeneratedImageResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load masks (public masks from backend)
        const loaded = await backendMasks.getMasks();
        setMasks(loaded);
        if (loaded.length > 0) {
          setSelectedMaskId(loaded[0].id);
          setSelectedDefIds(new Set());
        }
        
        // Load user's generation history
        const historyResponse = await backendHistory.getHistory(1, 100);
        setResults(historyResponse.history);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [currentUser.id]);
  
  // Auto-save results to backend history
  useEffect(() => {
    const saveHistory = async () => {
      // Only save completed results that haven't been saved yet
      const completedResults = results.filter(r => r.imageUrl && !r.loading && !r.savedToBackend);
      
      for (const result of completedResults) {
        try {
          const historyId = await backendHistory.createHistory({
            definitionId: result.definitionId,
            definitionName: result.definitionName,
            sourceImageUrl: result.sourceImage,
            generatedImageUrl: result.imageUrl || null,
            prompt: result.optimizedPrompt,
            optimizedPrompt: result.optimizedPrompt,
            model: result.model,
            maskId: selectedMaskId
          } as any);
          
          // Mark as saved to avoid duplicate saves
          setResults(prev => prev.map(r => 
            r.id === result.id ? { ...r, savedToBackend: true, historyId } : r
          ));
          
          console.log('Saved history:', historyId);
        } catch (error) {
          console.error('Failed to save history:', error);
        }
      }
    };
    
    const completedResults = results.filter(r => r.imageUrl && !r.loading && !r.savedToBackend);
    if (completedResults.length > 0) {
      saveHistory();
    }
  }, [results, currentUser.id, selectedMaskId]);

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

  const handleBatchDownload = async () => {
    const selectedResults = results.filter(r => selectedResultIds.has(r.id) && r.imageUrl);
    
    if (selectedResults.length === 0) return;

    // Use ZIP if multiple files selected, otherwise single download
    if (selectedResults.length === 1) {
      const result = selectedResults[0];
      if (result.imageUrl) {
        saveAs(result.imageUrl, `amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`);
      }
    } else {
      const zip = new JSZip();
      const folder = zip.folder("amazongen-images");
      
      let processedCount = 0;
      
      // Notify user download started (simple alert or toast ideally, using console for now)
      console.log("Preparing ZIP download...");

      for (const result of selectedResults) {
        if (!result.imageUrl) continue;
        try {
          // Fetch image data to blob
          const response = await fetch(result.imageUrl);
          const blob = await response.blob();
          folder?.file(`amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`, blob);
          processedCount++;
        } catch (e) {
          console.error("Failed to add image to zip", e);
        }
      }

      if (processedCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `amazongen-batch-${new Date().toISOString().slice(0,10)}.zip`);
      }
    }
    
    setSelectedResultIds(new Set()); // Optional: clear selection after download
  };

  // Regenerate as new version (from Modal)
  const handleRegenerateNew = async (sourceResult: GeneratedImageResult, refinePrompt?: string, model?: ModelType) => {
    // Determine the source image: PREFER the current generated image (imageUrl) if available (for refine/edit flow),
    // otherwise fallback to the original source (sourceImage).
    // This allows "Image-to-Image" refinement based on the AI output.
    const effectiveSourceImage = sourceResult.imageUrl || sourceResult.sourceImage;

    if (!effectiveSourceImage) {
      alert("无法重试：缺少原始图片");
      return;
    }

    // Find the definition
    const mask = masks.find(m => m.definitions.some(d => d.id === sourceResult.definitionId));
    if (!mask) {
      // Try to find mask from history if possible, or fail gracefully
      console.error("Mask not found for definition", sourceResult.definitionId);
      return;
    }
    
    const def = mask.definitions.find(d => d.id === sourceResult.definitionId);
    if (!def) return;

    // Create a NEW task
    const newId = crypto.randomUUID();
    const newTask: GeneratedImageResult = {
      id: newId,
      definitionId: def.id,
      definitionName: def.name,
      imageUrl: null,
      loading: true,
      step: 'generating', // Skip optimization for refine
      timestamp: Date.now(),
      sourceImage: effectiveSourceImage, // Store the effective source (AI image) for this new task
      model: model || sourceResult.model || selectedImageModel
    };

    // Prepend to results
    setResults(prev => [newTask, ...prev]);
    // Close modal if viewing
    setViewingResult(null); 

    try {
      // Reconstruct prompt based on current UI state OR original intent? 
      // User likely wants to apply CURRENT specs + refine instruction to the SAME source image & definition.
      // So we use current UI states for specs.
      
      const baseInstruction = def.prompt;
      let finalPrompt = `[System Instruction / Role Definition]\n${baseInstruction}\n\n[Target Specifications]`;
      
      // Use current UI inputs for specs, assuming user might have changed them or they match the context
      if (productWidth.trim() && productHeight.trim()) {
        finalPrompt += `\n- Product Size: ${productWidth}cm × ${productHeight}cm`;
      }
      if (appScenario.trim()) finalPrompt += `\n- Application Scenario: ${appScenario.trim()}`;
      if (productCaliber.trim()) {
        const caliberVal = productCaliber.trim();
        const hasUnit = /[a-zA-Z]/.test(caliberVal);
        finalPrompt += `\n- Product Caliber/Spec: ${caliberVal}${hasUnit ? '' : 'mm'}`;
      }

      // Add Refine Instruction if present
      if (refinePrompt && refinePrompt.trim()) {
        finalPrompt += `\n\n[User Refinement Instruction]\n${refinePrompt.trim()}`;
      }

      finalPrompt += `\n\n[Execution Command]\nBased on the visual analysis of the attached input image (which might be a previous generation) and the specifications above, generate the final scene image. Do not output conversational text. Output ONLY the image.`;

      // Update prompt in state
      setResults(prev => prev.map(r => 
        r.id === newId ? { ...r, optimizedPrompt: finalPrompt } : r
      ));

      const imageRes = await generateImageFromProduct(
        effectiveSourceImage, 
        finalPrompt, 
        newTask.model!
      );
      
      const imageUrl = imageRes.data.imageUrl;
      
      setResults(prev => prev.map(r => 
        r.id === newId ? { ...r, imageUrl, loading: false, step: undefined, savedToBackend: false } : r
      ));

    } catch (error) {
      console.error(`Regeneration failed for ${def.name}`, error);
      setResults(prev => prev.map(r => 
        r.id === newId 
          ? { ...r, error: "生成失败: " + (error instanceof Error ? error.message : "未知错误"), loading: false } 
          : r
      ));
    }
  };

  // Retry a failed generation
  const handleRetry = async (failedResult: GeneratedImageResult) => {
    if (!failedResult.sourceImage) {
      alert("无法重试：缺少原始图片");
      return;
    }

    // Find the definition
    const mask = masks.find(m => m.definitions.some(d => d.id === failedResult.definitionId));
    if (!mask) return;
    
    const def = mask.definitions.find(d => d.id === failedResult.definitionId);
    if (!def) return;

    // Reset this result to loading state
    setResults(prev => prev.map(r => 
      r.id === failedResult.id 
        ? { ...r, loading: true, error: undefined, step: 'optimizing', imageUrl: null } 
        : r
    ));

    try {
      // Reconstruct the prompt (same logic as handleGenerate)
      const baseInstruction = def.prompt;
      let finalPrompt = `[System Instruction / Role Definition]\n${baseInstruction}\n\n[Target Specifications]`;
      
      if (productWidth.trim() && productHeight.trim()) {
        finalPrompt += `\n- Product Size: ${productWidth}cm × ${productHeight}cm`;
      }
      if (appScenario.trim()) finalPrompt += `\n- Application Scenario: ${appScenario.trim()}`;
      if (productCaliber.trim()) {
        const caliberVal = productCaliber.trim();
        const hasUnit = /[a-zA-Z]/.test(caliberVal);
        finalPrompt += `\n- Product Caliber/Spec: ${caliberVal}${hasUnit ? '' : 'mm'}`;
      }
      finalPrompt += `\n\n[Execution Command]\nBased on the visual analysis of the attached product image and the specifications above, generate the final scene image. Do not output conversational text. Output ONLY the image.`;

      setResults(prev => prev.map(r => 
        r.id === failedResult.id ? { ...r, optimizedPrompt: finalPrompt, step: 'generating' } : r
      ));

      const imageRes = await generateImageFromProduct(
        failedResult.sourceImage, 
        finalPrompt, 
        failedResult.model || selectedImageModel
      );
      const imageUrl = imageRes.data.imageUrl;
      
      setResults(prev => prev.map(r => 
        r.id === failedResult.id ? { ...r, imageUrl, loading: false, step: undefined, savedToBackend: false } : r
      ));

    } catch (error) {
      console.error(`Retry failed for ${def.name}`, error);
      setResults(prev => prev.map(r => 
        r.id === failedResult.id 
          ? { ...r, error: "重试失败: " + (error instanceof Error ? error.message : "未知错误"), loading: false } 
          : r
      ));
    }
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
        // Construct final prompt with structured instruction
        const baseInstruction = def.prompt; // The mask prompt acts as the system/role instruction
        
        let finalPrompt = `[System Instruction / Role Definition]\n${baseInstruction}\n\n[Target Specifications]`;
        
        // Append user context fields
        if (productWidth.trim() && productHeight.trim()) {
           finalPrompt += `\n- Product Size: ${productWidth}cm × ${productHeight}cm`;
        }
        
        if (appScenario.trim()) finalPrompt += `\n- Application Scenario: ${appScenario.trim()}`;
        
        if (productCaliber.trim()) {
           // Auto-append 'mm' if user didn't specify units
           const caliberVal = productCaliber.trim();
           const hasUnit = /[a-zA-Z]/.test(caliberVal);
           finalPrompt += `\n- Product Caliber/Spec: ${caliberVal}${hasUnit ? '' : 'mm'}`;
        }
        
        // Final execution command
        finalPrompt += `\n\n[Execution Command]\nBased on the visual analysis of the attached product image and the specifications above, generate the final scene image. Do not output conversational text. Output ONLY the image.`;

        // Update status to generating immediately since we skip optimization
        setResults(prev => prev.map(r => 
          r.id === task.id ? { ...r, optimizedPrompt: finalPrompt, step: 'generating' } : r
        ));

        const imageRes = await generateImageFromProduct(sourceImage, finalPrompt, selectedImageModel);
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

  // Filter definitions based on search term
  const filteredDefinitions = useMemo(() => {
    if (!selectedMask) return [];
    if (!defSearchTerm.trim()) return selectedMask.definitions;
    return selectedMask.definitions.filter(d => 
      d.name.toLowerCase().includes(defSearchTerm.toLowerCase())
    );
  }, [selectedMask, defSearchTerm]);

  useEffect(() => {
    setSelectedDefIds(new Set());
    setDefSearchTerm(''); // Reset search on mask change
  }, [selectedMaskId]);

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* Detail Modal */}
      {viewingResult && (
        <ImageDetailModal 
          result={viewingResult} 
          maskName={masks.find(m => m.definitions.some(d => d.id === viewingResult.definitionId))?.name} // Try to find mask name loosely
          onClose={() => setViewingResult(null)} 
          onRegenerate={handleRegenerateNew}
        />
      )}
      
      {/* LEFT: Controls & Input */}
      <div className="w-[320px] min-w-[300px] border-r border-gray-200 flex flex-col bg-gray-50 z-10 shadow-lg h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">AmazonGen</h1>
            <p className="text-gray-500 text-xs mt-0.5">自动化产品摄影生成套件</p>
          </div>

          {/* 1. Mask Selection & Definition */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-2">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">1. 产品面具</label>
              <select 
                className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={selectedMaskId}
                onChange={(e) => setSelectedMaskId(e.target.value)}
              >
                {masks.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.definitions.length})
                  </option>
                ))}
              </select>
            </div>

            {selectedMask && (
              <div>
                 {/* Modern Search Bar */}
                 <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={`搜索镜头 (${filteredDefinitions.length}/${selectedMask.definitions.length})...`} 
                      className="w-full pl-8 pr-12 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
                      value={defSearchTerm}
                      onChange={(e) => setDefSearchTerm(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        if (selectedDefIds.size === filteredDefinitions.length && filteredDefinitions.length > 0) {
                          setSelectedDefIds(new Set());
                        } else {
                          setSelectedDefIds(new Set(filteredDefinitions.map(d => d.id)));
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 rounded hover:bg-blue-50"
                    >
                      {selectedDefIds.size > 0 && selectedDefIds.size === filteredDefinitions.length ? '清空' : '全选'}
                    </button>
                 </div>
                
                {/* Scrollable Definition List */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredDefinitions.length === 0 ? (
                    <div className="col-span-2 text-center py-4 text-gray-400 text-xs italic">
                      无匹配镜头
                    </div>
                  ) : (
                    filteredDefinitions.map(d => {
                      const isSelected = selectedDefIds.has(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleDefinitionSelection(d.id)}
                          className={`px-2 py-1.5 text-[11px] rounded border text-left transition-all truncate flex items-center justify-between group ${
                            isSelected 
                              ? 'bg-orange-50 border-orange-200 text-orange-800 font-medium' 
                              : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={d.name}
                        >
                          <span className="truncate">{d.name}</span>
                          {isSelected && <CheckCircle className="w-3 h-3 text-orange-500 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Upload & Info */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
             <div>
               <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">2. 产品图 (Upload)</label>
               <div 
                 className={`border border-dashed rounded-md p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative overflow-hidden h-28 ${sourceImage ? 'border-orange-500 bg-orange-50/30' : 'border-gray-300 hover:border-orange-400 bg-gray-50'}`}
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
                   <div className="flex flex-col items-center animate-pulse">
                      <Wand2 className="w-5 h-5 text-orange-500 mb-1" />
                      <span className="text-[10px] text-orange-600">处理中...</span>
                   </div>
                 ) : sourceImage ? (
                   <div className="relative w-full h-full group">
                     <img src={sourceImage} alt="Source" className="object-contain w-full h-full" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white text-xs font-medium">点击替换</span>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">点击上传</span>
                   </div>
                 )}
               </div>
             </div>

            {/* Compact Info Form */}
            <div className="pt-2 border-t border-gray-100">
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">补充参数 (Specs)</label>
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">尺寸<span className="text-red-500">*</span></span>
                    <div className="relative flex-1 flex items-center gap-1">
                      <input 
                        type="number" 
                        placeholder="10" 
                        className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 ${!productWidth.trim() ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-orange-500'}`}
                        value={productWidth}
                        onChange={(e) => setProductWidth(e.target.value)}
                      />
                      <span className="text-gray-400 text-xs">×</span>
                      <input 
                        type="number" 
                        placeholder="10" 
                        className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 ${!productHeight.trim() ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-orange-500'}`}
                        value={productHeight}
                        onChange={(e) => setProductHeight(e.target.value)}
                      />
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">cm</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">场景</span>
                    <input 
                      type="text" 
                      placeholder="桌面/户外" 
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={appScenario}
                      onChange={(e) => setAppScenario(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">规格</span>
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="50" 
                        className="w-full pl-2 pr-8 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={productCaliber}
                        onChange={(e) => setProductCaliber(e.target.value)}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">mm口径</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Area */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">3. 生图模型 (Model)</label>
             <select 
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-2 rounded text-xs focus:outline-none focus:border-orange-500"
                value={selectedImageModel}
                onChange={(e) => setSelectedImageModel(e.target.value as ModelType)}
              >
                <option value={ModelType.GEMINI_FLASH_IMAGE}>Gemini 2.5 Flash Image</option>
                <option value={ModelType.OR_GEMINI_3_IMAGE}>Gemini 3.0 Pro Image</option>
                <option value={ModelType.OR_GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash (OR)</option>
              </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating || isProcessingBg || !selectedMask || selectedDefIds.size === 0 || !productWidth.trim() || !productHeight.trim()}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all
              ${!sourceImage || isGenerating || isProcessingBg || selectedDefIds.size === 0 || !productWidth.trim() || !productHeight.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
              }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current text-orange-400" /> 开始生成 ({selectedDefIds.size})
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Preview Gallery */}
      <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative">
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm flex items-center gap-4 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">生成结果</h2>
            <p className="text-xs text-gray-500">{results.length > 0 ? `共 ${results.length} 张` : '等待生成...'}</p>
          </div>
          <div className="flex-1"></div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {results.map((result) => {
                const isSelected = selectedResultIds.has(result.id);
                // Find mask name for display
                const parentMask = masks.find(m => m.definitions.some(d => d.id === result.definitionId));
                
                return (
                  <div 
                    key={result.id} 
                    className={`bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col relative transition-all group hover:shadow-lg ${isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'}`}
                  >
                    {/* Header: Compact with Lens Label */}
                    <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">镜头 • {parentMask?.name || 'Mask'}</span>
                        <span className="font-bold text-xs text-gray-900 truncate leading-tight" title={result.definitionName}>
                          {result.definitionName}
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleResultSelection(result.id)}
                        className={`p-1 rounded transition-colors flex-shrink-0 ${isSelected ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Image Area */}
                    <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                      {/* Grid Pattern Background */}
                      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px'}}></div>
                      
                      {/* Image Display */}
                      {result.imageUrl ? (
                          <>
                          <img src={result.imageUrl} alt={result.definitionName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          
                          {/* Hover Overlay Actions */}
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[0.5px]">
                             {/* View Details */}
                             <button 
                               onClick={() => setViewingResult(result)} 
                               className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 shadow-md transition-all hover:scale-105"
                             >
                               <Maximize2 className="w-3.5 h-3.5" /> 查看
                             </button>

                             {/* Download */}
                             <a 
                               href={result.imageUrl} 
                               download={`amazongen-${result.definitionName}-${result.id.slice(0,4)}.png`}
                               className="p-2 bg-white rounded-full text-gray-700 hover:text-green-600 hover:bg-gray-50 shadow-md transition-all hover:scale-105"
                               title="下载"
                             >
                               <Download className="w-3.5 h-3.5" />
                             </a>
                          </div>
                          </>
                      ) : null}

                      {/* Loading Layer */}
                      {result.loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20">
                          <Loader2 className="w-7 h-7 animate-spin text-orange-500 mb-2" />
                          <span className="text-[10px] font-medium text-gray-600">{result.step === 'optimizing' ? '构思中...' : '绘制中...'}</span>
                        </div>
                      )}

                      {/* Error Layer */}
                      {!result.loading && result.error && (
                        <div className="flex flex-col items-center gap-2 text-red-500 px-3 text-center z-10">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-200">
                             <AlertCircle className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-medium leading-tight line-clamp-2 bg-white/90 px-2 py-1 rounded">{result.error}</span>
                          <button
                            onClick={() => handleRetry(result)}
                            className="mt-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-full flex items-center gap-1 transition-all hover:scale-105 shadow-md"
                          >
                            <RefreshCw className="w-3 h-3" /> 重新生成
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer: Source Icon + Meta */}
                    <div className="px-2 py-1.5 bg-white border-t border-gray-100 flex justify-between items-center">
                       <div className="flex items-center gap-1.5">
                         {/* Source Image Icon */}
                         {result.sourceImage && (
                           <div className="w-6 h-6 bg-gray-50 rounded border border-gray-200 p-0.5 flex-shrink-0" title="关联原图">
                             <img src={result.sourceImage} className="w-full h-full object-contain" alt="src" />
                           </div>
                         )}
                         <span className="text-[9px] text-gray-400 font-mono leading-none">{new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <span className="text-[9px] text-gray-400 truncate max-w-[70px] leading-none" title={result.model}>{result.model?.split('/').pop()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Batch Action Bar */}
        {selectedResultIds.size > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white pl-6 pr-4 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-gray-700">
            <span className="text-sm font-medium">已选 {selectedResultIds.size} 张</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button 
              onClick={handleBatchDownload}
              className="flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Download className="w-4 h-4" /> 
              {selectedResultIds.size === 1 ? '下载' : '打包下载 (ZIP)'}
            </button>
            <button 
              onClick={() => setSelectedResultIds(new Set())}
              className="ml-2 p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
