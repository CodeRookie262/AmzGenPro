/**
 * 系统设置内容组件
 */
import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { backendApiKeys } from '../../services/backendService';
import { clearApiKeysCache } from '../../services/openRouterService';
import { clearGoogleApiKeysCache } from '../../services/geminiService';

interface ApiKeys {
  google: string;
  openRouter: string;
}

export const SettingsContent: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeys>({ google: '', openRouter: '' });
  const [showGoogle, setShowGoogle] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const loadedKeys = await backendApiKeys.getApiKeys();
        setKeys(loadedKeys);
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    };
    loadKeys();
  }, []);

  const handleSave = async () => {
    try {
      await backendApiKeys.updateApiKeys(keys);
      clearApiKeysCache();
      clearGoogleApiKeysCache();
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
              type={showGoogle ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono"
              placeholder="AIzaSy..."
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
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
              type={showOpenRouter ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono"
              placeholder="sk-or-v1-..."
              value={keys.openRouter}
              onChange={(e) => setKeys({ ...keys, openRouter: e.target.value })}
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

