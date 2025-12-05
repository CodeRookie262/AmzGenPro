
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Layout, Layers, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ProductMask, ModelType, ImageDefinition } from '../types';
import { getMasks, saveMasks, createMask, createImageDefinition } from '../services/storageService';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [masks, setMasks] = useState<ProductMask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  
  // New Mask Form State
  const [newMaskName, setNewMaskName] = useState('');
  
  // Definition Form State
  const [newDefName, setNewDefName] = useState('');
  const [newDefPrompt, setNewDefPrompt] = useState('');

  useEffect(() => {
    setMasks(getMasks());
  }, []);

  const handleCreateMask = () => {
    if (!newMaskName.trim()) return;
    const newMask = createMask(newMaskName, ModelType.GEMINI_FLASH);
    const updatedMasks = [...masks, newMask];
    setMasks(updatedMasks);
    saveMasks(updatedMasks);
    setNewMaskName('');
    setSelectedMaskId(newMask.id);
  };

  const handleDeleteMask = (id: string) => {
    const updated = masks.filter(m => m.id !== id);
    setMasks(updated);
    saveMasks(updated);
    if (selectedMaskId === id) setSelectedMaskId(null);
  };

  const handleAddDefinition = () => {
    if (!selectedMaskId || !newDefName.trim() || !newDefPrompt.trim()) return;
    
    const updatedMasks = masks.map(mask => {
      if (mask.id === selectedMaskId) {
        return {
          ...mask,
          definitions: [...mask.definitions, createImageDefinition(newDefName, newDefPrompt)]
        };
      }
      return mask;
    });

    setMasks(updatedMasks);
    saveMasks(updatedMasks);
    setNewDefName('');
    setNewDefPrompt('');
  };

  const handleDeleteDefinition = (maskId: string, defId: string) => {
    const updatedMasks = masks.map(mask => {
      if (mask.id === maskId) {
        return {
          ...mask,
          definitions: mask.definitions.filter(d => d.id !== defId)
        };
      }
      return mask;
    });
    setMasks(updatedMasks);
    saveMasks(updatedMasks);
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar: Mask List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layout className="w-5 h-5" /> 面具管理 (产品线)
          </h2>
          <p className="text-xs text-gray-500 mt-1">配置不同产品的生成模版</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {masks.map(mask => (
            <div 
              key={mask.id}
              onClick={() => setSelectedMaskId(mask.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center group ${
                selectedMaskId === mask.id 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-orange-200'
              }`}
            >
              <div className="font-medium text-gray-700">{mask.name}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteMask(mask.id); }}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">新建面具</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="例如：登山靴 V1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              value={newMaskName}
              onChange={(e) => setNewMaskName(e.target.value)}
            />
            <button 
              onClick={handleCreateMask}
              className="bg-gray-900 text-white p-2 rounded-md hover:bg-gray-800"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Mask Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedMask ? (
          <>
            <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedMask.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                     <Sparkles className="w-4 h-4 text-blue-600" />
                     <span className="text-sm font-medium text-blue-900">提示词优化模型:</span>
                     <select 
                       className="ml-1 bg-transparent border-none text-sm font-bold text-blue-700 focus:ring-0 cursor-pointer"
                       value={selectedMask.promptModel}
                       onChange={(e) => {
                         const updated = masks.map(m => m.id === selectedMask.id ? {...m, promptModel: e.target.value as ModelType} : m);
                         setMasks(updated);
                         saveMasks(updated);
                       }}
                     >
                        <option value={ModelType.GEMINI_FLASH}>Gemini 2.5 Flash (快速/经济)</option>
                        <option value={ModelType.GEMINI_PRO}>Gemini 3 Pro (高智能)</option>
                     </select>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    已配置 {selectedMask.definitions.length} 个镜头
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Definition Form */}
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
                        onChange={(e) => setNewDefName(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">场景需求简述</label>
                      <input 
                        type="text" 
                        placeholder="例如：放在厨房大理石台面上，晨光，温馨氛围..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={newDefPrompt}
                        onChange={(e) => setNewDefPrompt(e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">这里只需填写简短的场景需求，系统会自动优化为详细的英文提示词。</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddDefinition}
                      className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" /> 保存定义
                    </button>
                  </div>
                </div>

                {/* List Definitions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Layers className="w-5 h-5" /> 已配置镜头
                  </h3>
                  {selectedMask.definitions.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无定义的镜头。请在上方添加。</p>
                    </div>
                  )}
                  {selectedMask.definitions.map(def => (
                    <div key={def.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between group">
                      <div>
                        <h4 className="font-bold text-gray-900">{def.name}</h4>
                        <p className="text-gray-600 mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-semibold text-gray-400 text-xs uppercase mr-2">Scene:</span>
                          {def.prompt}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteDefinition(selectedMask.id, def.id)}
                        className="text-gray-400 hover:text-red-500 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
            请选择一个面具以编辑配置
          </div>
        )}
      </div>
    </div>
  );
};
