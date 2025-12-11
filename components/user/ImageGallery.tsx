/**
 * 图片画廊组件
 */
import React from 'react';
import { GeneratedImageResult, ProductMask } from '../../types';
import { ImageIcon, Maximize2, Download, Square, CheckSquare, RefreshCw, AlertCircle, Calendar, Layers } from 'lucide-react';
import { formatTime, getModelDisplayName } from '../../utils/format';

interface ImageGalleryProps {
  results: GeneratedImageResult[];
  masks: ProductMask[];
  selectedResultIds: Set<string>;
  onResultToggle: (id: string) => void;
  onViewDetail: (result: GeneratedImageResult) => void;
  onRetry: (result: GeneratedImageResult) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  results,
  masks,
  selectedResultIds,
  onResultToggle,
  onViewDetail,
  onRetry,
}) => {
  const getMaskName = (definitionId: string): string => {
    const mask = masks.find(m => m.definitions.some(d => d.id === definitionId));
    return mask?.name || 'Unknown';
  };

  if (results.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-lg font-medium">准备就绪</p>
        <p className="text-sm">请在左侧选择至少一个镜头并开始生成</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {results.map((result) => {
        const isSelected = selectedResultIds.has(result.id);
        const parentMask = masks.find(m => m.definitions.some(d => d.id === result.definitionId));

        return (
          <div
            key={result.id}
            className={`bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col relative transition-all group hover:shadow-lg ${
              isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                  镜头 • {parentMask?.name || 'Mask'}
                </span>
                <span className="font-bold text-xs text-gray-900 truncate leading-tight" title={result.definitionName}>
                  {result.definitionName}
                </span>
              </div>
              <button
                onClick={() => onResultToggle(result.id)}
                className={`p-1 rounded transition-colors flex-shrink-0 ${
                  isSelected ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                }`}
              >
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
            </div>

            {/* Image Area */}
            <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />

              {result.imageUrl ? (
                <>
                  <img
                    src={result.imageUrl}
                    alt={result.definitionName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[0.5px]">
                    <button
                      onClick={() => onViewDetail(result)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 shadow-md transition-all hover:scale-105"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> 查看
                    </button>

                    <a
                      href={result.imageUrl}
                      download={`amazongen-${result.definitionName}-${result.id.slice(0, 4)}.png`}
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
                  <RefreshCw className="w-7 h-7 animate-spin text-orange-500 mb-2" />
                  <span className="text-[10px] font-medium text-gray-600">
                    {result.step === 'optimizing' ? '构思中...' : '绘制中...'}
                  </span>
                </div>
              )}

              {/* Error Layer */}
              {!result.loading && result.error && (
                <div className="flex flex-col items-center gap-2 text-red-500 px-3 text-center z-10">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-200">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight line-clamp-2 bg-white/90 px-2 py-1 rounded">
                    {result.error}
                  </span>
                  <button
                    onClick={() => onRetry(result)}
                    className="mt-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-full flex items-center gap-1 transition-all hover:scale-105 shadow-md"
                  >
                    <RefreshCw className="w-3 h-3" /> 重新生成
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-2 py-1.5 bg-white border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                {result.sourceImage && (
                  <div className="w-6 h-6 bg-gray-50 rounded border border-gray-200 p-0.5 flex-shrink-0" title="关联原图">
                    <img src={result.sourceImage} className="w-full h-full object-contain" alt="src" />
                  </div>
                )}
                <span className="text-[9px] text-gray-400 font-mono leading-none">
                  {formatTime(result.timestamp)}
                </span>
              </div>
              <span className="text-[9px] text-gray-400 truncate max-w-[70px] leading-none" title={result.model}>
                {getModelDisplayName(result.model || '')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

