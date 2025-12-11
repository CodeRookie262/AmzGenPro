/**
 * 图片详情模态框组件
 */
import React, { useState } from 'react';
import { X, Download, RefreshCw, Calendar, Zap, Layers } from 'lucide-react';
import { GeneratedImageResult, ModelType } from '../../types';
import { formatDateTime } from '../../utils/date';

interface ImageDetailModalProps {
  result: GeneratedImageResult | null;
  maskName?: string;
  onClose: () => void;
  onRegenerate: (result: GeneratedImageResult, refinePrompt?: string, model?: ModelType) => void;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  result,
  maskName,
  onClose,
  onRegenerate,
}) => {
  const [refinePrompt, setRefinePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    (result?.model as ModelType) || ModelType.GEMINI_FLASH_IMAGE
  );

  if (!result) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image */}
        <div className="w-2/3 bg-gray-100 flex items-center justify-center p-8 relative">
          <div className="pattern-grid absolute inset-0 opacity-5 pointer-events-none" />
          {result.imageUrl ? (
            <img
              src={result.imageUrl}
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
              alt="Generated"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <X className="w-12 h-12 mb-2" />
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
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                关联原图 (Source)
              </span>
            </div>
          )}

          {/* Refine / Regenerate Section */}
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

              {/* Model Selection */}
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
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 生成时间
              </span>
              <span className="font-medium">{formatDateTime(result.timestamp)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> 原始模型
              </span>
              <span className="font-medium truncate max-w-[150px]">{result.model}</span>
            </div>

            <a
              href={result.imageUrl || '#'}
              download={`amazongen-${result.definitionName}-${result.id.slice(0, 4)}.png`}
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

