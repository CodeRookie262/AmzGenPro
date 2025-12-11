/**
 * 图片上传组件 - 支持多图上传
 */
import React, { useRef, useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { ImageItem } from './ImageItem';
import { SourceImage } from '../../hooks/useImageGeneration';

interface ImageUploaderProps {
  sourceImages: SourceImage[];
  isProcessing: boolean;
  onFilesSelect: (files: File[]) => void;
  onImageDelete: (imageId: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  sourceImages,
  isProcessing,
  onFilesSelect,
  onImageDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelect(files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file): file is File =>
      file instanceof File && file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  const hasImages = sourceImages.length > 0;

  return (
    <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200">
      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1">
          2. 产品图 (Upload)
        </label>

        {/* Image List */}
        {hasImages && (
          <div className="flex flex-wrap gap-1.5 mb-2 p-1.5 bg-gray-50 rounded-md border border-gray-100 min-h-[68px]">
            {sourceImages.map((img, index) => (
              <ImageItem
                key={img.id}
                imageUrl={img.url}
                index={index}
                processing={img.processing}
                onDelete={() => onImageDelete(img.id)}
              />
            ))}
          </div>
        )}

        {/* Upload Area - 一直显示，允许随时添加更多图片 */}
        <div
          className={`border border-dashed rounded-md p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative overflow-hidden ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : hasImages
              ? 'border-gray-300 hover:border-orange-400 bg-gray-50'
              : 'border-gray-300 hover:border-orange-400 bg-gray-50 h-20'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isProcessing}
          />

          {hasImages ? (
            <div className="flex flex-col items-center gap-1">
              <Plus className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] text-gray-500">添加更多</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] text-gray-500">点击上传或拖拽图片</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
