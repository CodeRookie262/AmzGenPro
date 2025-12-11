/**
 * 管理面板 - 重构版本（使用子组件和Hooks）
 */
import React, { useState, useEffect } from 'react';
import { User, UserRole, ModelType, ImageDefinition } from '../types';
import { backendMasks, backendUsers } from '../services/backendService';
import { useMasks } from '../contexts/MaskContext';
import { useUserImport } from '../hooks/useUserImport';
import { Sparkles, Layout, Users, Key, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { MaskList } from './admin/MaskList';
import { MaskCreator } from './admin/MaskCreator';
import { DefinitionForm } from './admin/DefinitionForm';
import { DefinitionList } from './admin/DefinitionList';
import { UserCreator } from './admin/UserCreator';
import { UserList } from './admin/UserList';
import { SettingsContent } from './admin/SettingsContent';

interface AdminPanelProps {
  currentUser: User;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBack }) => {
  const { masks, refreshMasks } = useMasks();
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'masks' | 'users' | 'settings'>('masks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mask Form State
  const [newMaskName, setNewMaskName] = useState('');
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

  const { downloadTemplate, importUsers } = useUserImport(users);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await backendUsers.getUsers();
        setUsers(usersData.filter(u => u.role === UserRole.USER));
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  // Mask handlers
  const handleCreateMask = async () => {
    if (!newMaskName.trim()) return;
    try {
      const newMask = await backendMasks.createMask(newMaskName, ModelType.GEMINI_FLASH, []);
      await refreshMasks();
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
      await refreshMasks();
      if (selectedMaskId === id) setSelectedMaskId(null);
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleAddDefinition = async () => {
    if (!selectedMaskId || !newDefName.trim() || !newDefPrompt.trim()) return;
    try {
      await backendMasks.addDefinition(selectedMaskId, newDefName, newDefPrompt);
      await refreshMasks();
      setNewDefName('');
      setNewDefPrompt('');
    } catch (error: any) {
      alert('添加失败: ' + (error.message || '未知错误'));
    }
  };

  const handleDeleteDefinition = async (defId: string) => {
    if (!confirm('确定要删除这个镜头定义吗？')) return;
    try {
      await backendMasks.deleteDefinition(defId);
      await refreshMasks();
      if (editingDefId === defId) {
        setEditingDefId(null);
        setEditDefName('');
        setEditDefPrompt('');
      }
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
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
      await refreshMasks();
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

  // User handlers
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      alert('请输入用户名和密码');
      return;
    }
    try {
      const newUser = await backendUsers.createUser(
        newUserName.trim(),
        newUserPassword.trim(),
        UserRole.USER
      );
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

  const handleUserImport = async (file: File) => {
    try {
      const { successCount, newUsers } = await importUsers(file);
      if (successCount > 0) {
        setUsers([...users, ...newUsers]);
        alert(`成功导入 ${successCount} 个账号`);
      } else {
        alert('未导入任何账号，请检查文件格式（姓名,密码）');
      }
    } catch (error) {
      alert('导入失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className={`border-b border-gray-200 transition-all ${
          isSidebarCollapsed ? 'p-4' : 'p-6'
        }`}>
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" /> 管理后台
              </h1>
            )}
            {isSidebarCollapsed && (
              <Sparkles className="w-6 h-6 text-orange-500 mx-auto" />
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors ml-auto"
              title={isSidebarCollapsed ? '展开侧边栏' : '收缩侧边栏'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('masks')}
            className={`w-full rounded-lg text-sm font-medium transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3 gap-3'
            } ${
              activeTab === 'masks'
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title={isSidebarCollapsed ? '公共面具' : ''}
          >
            <Layout className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>公共面具</span>}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full rounded-lg text-sm font-medium transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3 gap-3'
            } ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title={isSidebarCollapsed ? '员工管理' : ''}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>员工管理</span>}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full rounded-lg text-sm font-medium transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3 gap-3'
            } ${
              activeTab === 'settings'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title={isSidebarCollapsed ? '系统设置' : ''}
          >
            <Key className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>系统设置</span>}
          </button>
        </nav>

        <div className={`border-t border-gray-200 space-y-2 transition-all ${
          isSidebarCollapsed ? 'p-2' : 'p-4'
        }`}>
          <button
            onClick={onBack}
            className={`w-full text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center transition-colors ${
              isSidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 gap-2'
            }`}
            title={isSidebarCollapsed ? '返回生成器' : ''}
          >
            <ImageIcon className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span>返回生成器</span>}
          </button>
          {!isSidebarCollapsed && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentUser.avatar || '👑'}</span>
                <span className="font-medium">{currentUser.name}</span>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="flex justify-center pt-2 border-t border-gray-100">
              <span className="text-lg">{currentUser.avatar || '👑'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'masks' && (
          <div className="flex h-full">
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <MaskCreator
                newMaskName={newMaskName}
                onNameChange={setNewMaskName}
                onCreate={handleCreateMask}
              />
              <MaskList
                masks={masks}
                selectedMaskId={selectedMaskId}
                onSelectMask={setSelectedMaskId}
                onDeleteMask={handleDeleteMask}
              />
            </div>

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
                      <DefinitionForm
                        newDefName={newDefName}
                        newDefPrompt={newDefPrompt}
                        onNameChange={setNewDefName}
                        onPromptChange={setNewDefPrompt}
                        onSubmit={handleAddDefinition}
                      />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Layout className="w-5 h-5" /> 已配置镜头
                        </h3>
                        <DefinitionList
                          definitions={selectedMask.definitions}
                          editingDefId={editingDefId}
                          editDefName={editDefName}
                          editDefPrompt={editDefPrompt}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onEditNameChange={setEditDefName}
                          onEditPromptChange={setEditDefPrompt}
                          onDelete={handleDeleteDefinition}
                        />
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

        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-white">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" /> 员工账号管理
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                管理所有员工账号，删除账号将清除该员工的所有数据
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                <UserCreator
                  newUserName={newUserName}
                  newUserPassword={newUserPassword}
                  onNameChange={setNewUserName}
                  onPasswordChange={setNewUserPassword}
                  onCreate={handleCreateUser}
                  onImport={handleUserImport}
                  onDownloadTemplate={downloadTemplate}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" /> 员工列表 ({users.length})
                  </h3>
                  <UserList users={users} onDelete={handleDeleteUser} />
                </div>
              </div>
            </div>
          </div>
        )}

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
