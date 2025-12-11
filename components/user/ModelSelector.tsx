/**
 * 模型选择器组件
 */
import React from 'react';
import { Zap } from 'lucide-react';
import { ModelType } from '../../types';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
}) => {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
        3. 生图模型 (Model)
      </label>
      <div className="relative">
        <Zap className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
        >
          <option value={ModelType.GEMINI_FLASH_IMAGE}>Gemini 2.5 Flash Image</option>
          <option value={ModelType.OR_GEMINI_3_IMAGE}>Gemini 3.0 Pro Image</option>
          <option value={ModelType.OR_GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash (OR)</option>
        </select>
      </div>
    </div>
  );
};

