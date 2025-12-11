/**
 * 面具创建组件
 */
import React from 'react';
import { Plus } from 'lucide-react';

interface MaskCreatorProps {
  newMaskName: string;
  onNameChange: (name: string) => void;
  onCreate: () => void;
}

export const MaskCreator: React.FC<MaskCreatorProps> = ({
  newMaskName,
  onNameChange,
  onCreate,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="新建面具名称..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          value={newMaskName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onCreate()}
        />
        <button
          onClick={onCreate}
          className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 flex items-center justify-center"
          title="创建面具"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

