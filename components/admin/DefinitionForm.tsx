/**
 * 镜头定义表单组件
 */
import React from 'react';
import { Plus, Save } from 'lucide-react';

interface DefinitionFormProps {
  newDefName: string;
  newDefPrompt: string;
  onNameChange: (name: string) => void;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
}

export const DefinitionForm: React.FC<DefinitionFormProps> = ({
  newDefName,
  newDefPrompt,
  onNameChange,
  onPromptChange,
  onSubmit,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-orange-500" /> 添加镜头定义
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">镜头名称</label>
          <input
            type="text"
            placeholder="例如：主图白底"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={newDefName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">场景需求简述</label>
          <textarea
            placeholder="例如：放在厨房大理石台面上，晨光，温馨氛围..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[100px] resize-y"
            value={newDefPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2 font-medium"
        >
          <Save className="w-4 h-4" /> 保存定义
        </button>
      </div>
    </div>
  );
};

