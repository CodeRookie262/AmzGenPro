/**
 * 图片项组件 - 显示单张图片，支持删除
 */
import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface ImageItemProps {
  imageUrl: string;
  index: number;
  processing?: boolean;
  onDelete: () => void;
}

export const ImageItem: React.FC<ImageItemProps> = ({ imageUrl, index, processing = false, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className={`relative w-16 h-16 bg-white border border-gray-200 rounded-md overflow-hidden group flex-shrink-0 ${
        processing ? 'cursor-wait' : ''
      }`}
    >
      <img
        src={imageUrl}
        alt={`Product ${index + 1}`}
        className={`w-full h-full object-contain ${
          processing ? 'opacity-60 animate-pulse' : ''
        }`}
      />
      
      {/* 去白底处理中的遮罩层和动画 */}
      {processing && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
          <Loader2 className="w-4 h-4 text-orange-500 animate-spin mb-1" />
          <span className="text-[8px] text-orange-600 font-medium">去白底中</span>
        </div>
      )}
      
      {!processing && (
        <>
          <button
            onClick={handleDelete}
            className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
            title="删除"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            {index + 1}
          </div>
        </>
      )}
    </div>
  );
};

