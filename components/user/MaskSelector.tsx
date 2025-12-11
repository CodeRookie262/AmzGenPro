/**
 * 面具选择器组件
 */
import React from 'react';
import { ProductMask, ImageDefinition } from '../../types';
import { Search, CheckCircle } from 'lucide-react';

interface MaskSelectorProps {
  masks: ProductMask[];
  selectedMaskId: string;
  selectedDefinitionIds: Set<string>;
  onMaskChange: (maskId: string) => void;
  onDefinitionToggle: (defId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const MaskSelector: React.FC<MaskSelectorProps> = ({
  masks,
  selectedMaskId,
  selectedDefinitionIds,
  onMaskChange,
  onDefinitionToggle,
  searchTerm,
  onSearchChange,
}) => {
  const selectedMask = masks.find(m => m.id === selectedMaskId);
  
  const filteredDefinitions = selectedMask
    ? selectedMask.definitions.filter(d =>
        !searchTerm.trim() || d.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleToggleAll = () => {
    if (selectedDefinitionIds.size === filteredDefinitions.length && filteredDefinitions.length > 0) {
      filteredDefinitions.forEach(def => {
        if (selectedDefinitionIds.has(def.id)) {
          onDefinitionToggle(def.id);
        }
      });
    } else {
      filteredDefinitions.forEach(def => {
        if (!selectedDefinitionIds.has(def.id)) {
          onDefinitionToggle(def.id);
        }
      });
    }
  };

  return (
    <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200 space-y-1.5">
      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1">
          1. 产品面具
        </label>
        <div className="flex gap-1.5 items-center">
          <select
            className="w-32 flex-shrink-0 bg-gray-50 border border-gray-300 text-gray-800 text-xs py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={selectedMaskId}
            onChange={(e) => onMaskChange(e.target.value)}
          >
            {masks.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.definitions.length})
              </option>
            ))}
          </select>
          {selectedMask && (
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`搜索 (${filteredDefinitions.length}/${selectedMask.definitions.length})`}
                className="w-full pl-7 pr-10 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <button
                onClick={handleToggleAll}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 rounded hover:bg-blue-50"
              >
                {selectedDefinitionIds.size > 0 && selectedDefinitionIds.size === filteredDefinitions.length
                  ? '清空'
                  : '全选'}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedMask && (
        <div>

          <div className="grid grid-cols-2 gap-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
            {filteredDefinitions.length === 0 ? (
              <div className="col-span-2 text-center py-4 text-gray-400 text-xs italic">
                无匹配镜头
              </div>
            ) : (
              filteredDefinitions.map(d => {
                const isSelected = selectedDefinitionIds.has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => onDefinitionToggle(d.id)}
                    className={`px-2 py-1 text-[11px] rounded border text-left transition-all truncate flex items-center justify-between group ${
                      isSelected
                        ? 'bg-orange-50 border-orange-200 text-orange-800 font-medium'
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                    }`}
                    title={d.name}
                  >
                    <span className="truncate">{d.name}</span>
                    {isSelected && <CheckCircle className="w-3 h-3 text-orange-500 flex-shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

