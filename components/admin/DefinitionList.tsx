/**
 * 镜头定义列表组件
 */
import React from 'react';
import { ImageDefinition } from '../../types';
import { ImageIcon, Edit2, Trash2, Check } from 'lucide-react';

interface DefinitionListProps {
  definitions: ImageDefinition[];
  editingDefId: string | null;
  editDefName: string;
  editDefPrompt: string;
  onStartEdit: (def: ImageDefinition) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onEditPromptChange: (prompt: string) => void;
  onDelete: (defId: string) => void;
}

export const DefinitionList: React.FC<DefinitionListProps> = ({
  definitions,
  editingDefId,
  editDefName,
  editDefPrompt,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onEditPromptChange,
  onDelete,
}) => {
  if (definitions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">暂无定义的镜头。请在上方添加。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {definitions.map(def => (
        <div key={def.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm group">
          {editingDefId === def.id ? (
            /* Editing Mode */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">镜头名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={editDefName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">场景需求</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 h-[150px] resize-none overflow-y-auto"
                  value={editDefPrompt}
                  onChange={(e) => onEditPromptChange(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={onSaveEdit}
                  className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> 保存
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{def.name}</h4>
                <div className="text-gray-600 mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap h-[150px] overflow-y-auto">
                  <span className="font-semibold text-gray-400 text-xs uppercase mr-2">Scene:</span>
                  {def.prompt}
                </div>
              </div>
              <div className="flex gap-1 ml-3 flex-shrink-0">
                <button
                  onClick={() => onStartEdit(def)}
                  className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(def.id)}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

