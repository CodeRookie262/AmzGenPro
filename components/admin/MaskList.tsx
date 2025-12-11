/**
 * 面具列表组件
 */
import React from 'react';
import { ProductMask } from '../../types';
import { Layout, Trash2 } from 'lucide-react';

interface MaskListProps {
  masks: ProductMask[];
  selectedMaskId: string | null;
  onSelectMask: (maskId: string) => void;
  onDeleteMask: (maskId: string) => void;
}

export const MaskList: React.FC<MaskListProps> = ({
  masks,
  selectedMaskId,
  onSelectMask,
  onDeleteMask,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {masks.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Layout className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无面具，请创建</p>
        </div>
      ) : (
        masks.map(mask => (
          <div
            key={mask.id}
            onClick={() => onSelectMask(mask.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${
              selectedMaskId === mask.id
                ? 'border-orange-500 bg-orange-50 shadow-sm'
                : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-700 truncate">{mask.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{mask.definitions.length} 个镜头</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMask(mask.id);
              }}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 ml-2 p-1"
              title="删除面具"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

