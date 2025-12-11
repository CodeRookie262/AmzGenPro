/**
 * 批量下载操作栏组件
 */
import React from 'react';
import { Download, X } from 'lucide-react';

interface BatchDownloadBarProps {
  selectedCount: number;
  onDownload: () => void;
  onClear: () => void;
}

export const BatchDownloadBar: React.FC<BatchDownloadBarProps> = ({
  selectedCount,
  onDownload,
  onClear,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white pl-6 pr-4 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-gray-700">
      <span className="text-sm font-medium">已选 {selectedCount} 张</span>
      <div className="h-4 w-px bg-gray-700"></div>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
      >
        <Download className="w-4 h-4" />
        {selectedCount === 1 ? '下载' : '打包下载 (ZIP)'}
      </button>
      <button
        onClick={onClear}
        className="ml-2 p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

