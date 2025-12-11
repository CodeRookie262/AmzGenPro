/**
 * 用户创建组件 - 使用 Modal 方式
 */
import React, { useState, useRef } from 'react';
import { UserPlus, Plus, FileSpreadsheet, X, Download } from 'lucide-react';

interface UserCreatorProps {
  newUserName: string;
  newUserPassword: string;
  onNameChange: (name: string) => void;
  onPasswordChange: (password: string) => void;
  onCreate: () => void;
  onImport: (file: File) => void;
  onDownloadTemplate: () => void;
}

// 添加员工 Modal
const AddUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  newUserName: string;
  newUserPassword: string;
  onNameChange: (name: string) => void;
  onPasswordChange: (password: string) => void;
  onCreate: () => void;
}> = ({ isOpen, onClose, newUserName, newUserPassword, onNameChange, onPasswordChange, onCreate }) => {
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      return;
    }
    onCreate();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> 添加员工
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">员工姓名</label>
            <input
              type="text"
              placeholder="输入姓名"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newUserName}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">登录密码</label>
            <input
              type="text"
              placeholder="设置密码"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newUserPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newUserName.trim() || !newUserPassword.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> 添加
          </button>
        </div>
      </div>
    </div>
  );
};

// 批量导入员工 Modal
const ImportUsersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  onDownloadTemplate: () => void;
}> = ({ isOpen, onClose, onImport, onDownloadTemplate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-500" /> 批量导入员工
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2 font-medium">导入说明：</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>支持 CSV 或 TXT 格式文件</li>
              <li>文件格式：姓名,密码（每行一个账号）</li>
              <li>示例：张三,123456</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDownloadTemplate}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> 下载模板
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> 选择文件
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserCreator: React.FC<UserCreatorProps> = ({
  newUserName,
  newUserPassword,
  onNameChange,
  onPasswordChange,
  onCreate,
  onImport,
  onDownloadTemplate,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> 员工管理
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> 添加员工
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-2 font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> 批量导入
            </button>
          </div>
        </div>
      </div>

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          onNameChange('');
          onPasswordChange('');
        }}
        newUserName={newUserName}
        newUserPassword={newUserPassword}
        onNameChange={onNameChange}
        onPasswordChange={onPasswordChange}
        onCreate={onCreate}
      />

      <ImportUsersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImport}
        onDownloadTemplate={onDownloadTemplate}
      />
    </>
  );
};

