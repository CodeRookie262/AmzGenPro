
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Layout, Layers, Image as ImageIcon, Sparkles, Key, X, Eye, EyeOff, Edit2, Check, Users, UserPlus, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { ProductMask, ModelType, ImageDefinition, User, UserRole } from '../types';
import { backendMasks, backendUsers, backendApiKeys } from '../services/backendService';
import { clearApiKeysCache } from '../services/openRouterService';
import { clearGoogleApiKeysCache } from '../services/geminiService';

export interface ApiKeys {
  google: string;
  openRouter: string;
}

interface AdminPanelProps {
  currentUser: User;
  onBack: () => void;
}

// API Key Modal Component (for modal usage)
const ApiKeyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <SettingsContent onSave={onClose} />
      </div>
    </div>
  );
};

// Settings Content Component (for inline usage)
const SettingsContent: React.FC<{ onSave?: () => void }> = ({ onSave }) => {
  const [keys, setKeys] = useState<ApiKeys>({ google: '', openRouter: '' });
  const [showGoogle, setShowGoogle] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const keys = await backendApiKeys.getApiKeys();
        setKeys(keys);
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    };
    loadKeys();
  }, []);

  const handleSave = async () => {
    try {
      await backendApiKeys.updateApiKeys(keys);
      // Clear cache so services will fetch fresh keys from backend
      clearApiKeysCache();
      clearGoogleApiKeysCache();
      if (onSave) onSave();
      alert('API Keys 已保存');
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'));
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Key className="w-5 h-5 text-orange-500" /> API Key 管理
      </h2>
      <p className="text-sm text-gray-500 mb-6">配置各服务商的 API 密钥，将存储在服务器数据库中。</p>
      
      <div className="space-y-4">
        {/* Google Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Gemini API Key</label>
          <div className="relative">
            <input 
              type={showGoogle ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono"
              placeholder="AIzaSy..."
              value={keys.google}
              onChange={(e) => setKeys({...keys, google: e.target.value})}
            />
            <button 
              onClick={() => setShowGoogle(!showGoogle)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showGoogle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">用于 Gemini Flash/Pro 原生模型调用及背景移除。</p>
        </div>

        {/* OpenRouter Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">OpenRouter API Key</label>
          <div className="relative">
            <input 
              type={showOpenRouter ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono"
              placeholder="sk-or-v1-..."
              value={keys.openRouter}
              onChange={(e) => setKeys({...keys, openRouter: e.target.value})}
            />
            <button 
              onClick={() => setShowOpenRouter(!showOpenRouter)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">用于 OpenRouter 模型 (如 Gemini 3 Pro Preview, NaNobanana)。</p>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
        >
          保存配置
        </button>
      </div>
    </>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBack }) => {
  const [masks, setMasks] = useState<ProductMask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'masks' | 'users' | 'settings'>('masks');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CSV Import/Export Logic ---

  const downloadTemplate = () => {
    const csvContent = "姓名,密码\n张三,123456\n李四,abcdef";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '员工导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      let successCount = 0;
      const newUsers: User[] = [];
      
      // Skip header if it looks like a header (contains "姓名" or "Name")
      const startIndex = lines[0].includes('姓名') || lines[0].includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV split (simple comma separation)
        const parts = line.split(/,|，/); // Support both English and Chinese commas
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const password = parts[1].trim();
          
          if (name && password) {
            // Check if user already exists
            const exists = users.some(u => u.name === name);
            if (!exists) {
              try {
                const newUser = await backendUsers.createUser(name, password, UserRole.USER);
                newUsers.push(newUser);
                successCount++;
              } catch (error) {
                // User might already exist, skip
                console.error('Failed to create user:', name, error);
              }
            }
          }
        }
      }
      
      if (successCount > 0) {
        setUsers([...users, ...newUsers]);
        alert(`成功导入 ${successCount} 个账号`);
      } else {
        alert('未导入任何账号，请检查文件格式（姓名,密码）');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };
  
  // New Mask Form State
  const [newMaskName, setNewMaskName] = useState('');
  
  // Definition Form State
  const [newDefName, setNewDefName] = useState('');
  const [newDefPrompt, setNewDefPrompt] = useState('');
  
  // Edit Definition State
  const [editingDefId, setEditingDefId] = useState<string | null>(null);
  const [editDefName, setEditDefName] = useState('');
  const [editDefPrompt, setEditDefPrompt] = useState('');
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [masksData, usersData] = await Promise.all([
          backendMasks.getMasks(),
          backendUsers.getUsers()
        ]);
        setMasks(masksData);
        setUsers(usersData.filter(u => u.role === UserRole.USER));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleCreateMask = async () => {
    if (!newMaskName.trim()) return;
    try {
      const newMask = await backendMasks.createMask(newMaskName, ModelType.GEMINI_FLASH, []);
      setMasks([...masks, newMask]);
      setNewMaskName('');
      setSelectedMaskId(newMask.id);
    } catch (error: any) {
      alert('创建失败: ' + (error.message || '未知错误'));
    }
  };

  const handleDeleteMask = async (id: string) => {
    if (!confirm('确定要删除这个面具吗？')) return;
    try {
      await backendMasks.deleteMask(id);
      setMasks(masks.filter(m => m.id !== id));
      if (selectedMaskId === id) setSelectedMaskId(null);
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleAddDefinition = async () => {
    if (!selectedMaskId || !newDefName.trim() || !newDefPrompt.trim()) return;
    try {
      await backendMasks.addDefinition(selectedMaskId, newDefName, newDefPrompt);
      // Reload masks from backend to ensure we have the latest data
      const updatedMasks = await backendMasks.getMasks();
      setMasks(updatedMasks);
      setNewDefName('');
      setNewDefPrompt('');
    } catch (error: any) {
      alert('添加失败: ' + (error.message || '未知错误'));
    }
  };

  const handleDeleteDefinition = async (maskId: string, defId: string) => {
    if (!confirm('确定要删除这个镜头定义吗？')) return;
    try {
      await backendMasks.deleteDefinition(defId);
      // Reload masks from backend to ensure we have the latest data
      const updatedMasks = await backendMasks.getMasks();
    setMasks(updatedMasks);
    if (editingDefId === defId) setEditingDefId(null);
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };
  
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      alert('请输入用户名和密码');
      return;
    }
    try {
      const newUser = await backendUsers.createUser(newUserName.trim(), newUserPassword.trim(), UserRole.USER);
      setUsers([...users, newUser]);
      setNewUserName('');
      setNewUserPassword('');
    } catch (error: any) {
      alert('创建失败: ' + (error.message || '未知错误'));
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    const userName = users.find(u => u.id === userId)?.name;
    if (confirm(`确定要删除用户 "${userName}" 吗？此操作将删除该用户的所有数据。`)) {
      try {
        await backendUsers.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error: any) {
        alert('删除失败: ' + (error.message || '未知错误'));
      }
    }
  };

  const handleStartEdit = (def: ImageDefinition) => {
    setEditingDefId(def.id);
    setEditDefName(def.name);
    setEditDefPrompt(def.prompt);
  };

  const handleSaveEdit = async () => {
    if (!selectedMaskId || !editingDefId || !editDefName.trim() || !editDefPrompt.trim()) return;
    try {
      await backendMasks.updateDefinition(editingDefId, editDefName.trim(), editDefPrompt.trim());
      
      // Reload masks from backend to ensure we have the latest data
      const updatedMasks = await backendMasks.getMasks();
      setMasks(updatedMasks);
      
      setEditingDefId(null);
      setEditDefName('');
      setEditDefPrompt('');
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'));
    }
  };

  const handleCancelEdit = () => {
    setEditingDefId(null);
    setEditDefName('');
    setEditDefPrompt('');
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar: Pure Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" /> 管理后台
          </h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('masks')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
              activeTab === 'masks'
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layout className="w-5 h-5" /> 公共面具
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" /> 员工管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
              activeTab === 'settings'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Key className="w-5 h-5" /> 系统设置
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onBack}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ImageIcon className="w-4 h-4" /> 返回生成器
          </button>
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentUser.avatar || '👑'}</span>
              <span className="font-medium">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Masks Management Tab */}
        {activeTab === 'masks' && (
          <div className="flex h-full">
            {/* Left: Mask List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Toolbar: Create Mask */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="新建面具名称..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={newMaskName}
                    onChange={(e) => setNewMaskName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateMask()}
                  />
                  <button 
                    onClick={handleCreateMask}
                    className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 flex items-center justify-center"
                    title="创建面具"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Mask List */}
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
                      onClick={() => setSelectedMaskId(mask.id)}
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
                        onClick={(e) => { e.stopPropagation(); handleDeleteMask(mask.id); }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 ml-2 p-1"
                        title="删除面具"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Mask Details */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedMask ? (
                <>
            <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedMask.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-medium">
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
                      <textarea 
                        placeholder="例如：放在厨房大理石台面上，晨光，温馨氛围..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[100px] resize-y"
                        value={newDefPrompt}
                        onChange={(e) => setNewDefPrompt(e.target.value)}
                      />
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
                              onChange={(e) => setEditDefName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">场景需求</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[150px] resize-y"
                              value={editDefPrompt}
                              onChange={(e) => setEditDefPrompt(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                              取消
                            </button>
                            <button 
                              onClick={handleSaveEdit}
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
                            <p className="text-gray-600 mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap">
                              <span className="font-semibold text-gray-400 text-xs uppercase mr-2">Scene:</span>
                              {def.prompt}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-3 flex-shrink-0">
                            <button 
                              onClick={() => handleStartEdit(def)}
                              className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDefinition(selectedMask.id, def.id)}
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
              </div>
            </div>
                </>
              ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                  <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">请从左侧选择一个面具以编辑配置</p>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" /> 员工账号管理
            </h1>
            <p className="text-sm text-gray-500 mt-2">管理所有员工账号，删除账号将清除该员工的所有数据</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Add User & Import Toolbar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" /> 快速添加员工
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadTemplate}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 flex items-center gap-2 transition-colors"
                      title="下载 CSV 模板"
                    >
                      <Download className="w-4 h-4" /> 下载模板
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm border border-green-600 text-green-700 rounded-md hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> 批量导入
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,.txt"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Compact Form */}
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="w-full md:flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">员工姓名</label>
                    <input 
                      type="text" 
                      placeholder="输入姓名"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">登录密码</label>
                    <input 
                      type="text" 
                      placeholder="设置密码"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                    />
                  </div>
                  <button 
                    onClick={handleCreateUser}
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> 添加
                  </button>
                </div>
              </div>
              
              {/* User List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5" /> 员工列表 ({users.length})
                </h3>
                {users.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无员工账号</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map(user => (
                      <div key={user.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-2xl">
                            {user.avatar || '👤'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{user.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              创建于 {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                          title="删除账号"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-white">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-6 h-6" /> 系统设置
              </h1>
              <p className="text-sm text-gray-500 mt-2">配置 API Keys 以启用 AI 功能</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="max-w-3xl mx-auto">
                <SettingsContent />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
