
import React, { useState } from 'react';
import { User } from '../types';
import { backendAuth } from '../services/backendService';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginPanelProps {
  onLogin: (user: User) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await backendAuth.login(username.trim(), password);
      onLogin(response.user);
    } catch (err: any) {
      setError(err.message || '用户名或密码错误');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AmazonGen</h1>
          <p className="text-gray-600">自动化产品摄影生成套件</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6" /> 登录
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                  disabled={isLoading}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                isLoading || !username.trim() || !password.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <p className="text-xs text-gray-500 text-center">
              默认管理员账号：<span className="font-mono font-medium">admin</span> / <span className="font-mono font-medium">admin</span>
            </p>
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('amazongen_users');
                  alert('已清除用户数据，请刷新页面');
                  window.location.reload();
                }}
                className="text-xs text-red-500 hover:text-red-700 underline mx-auto block"
              >
                清除数据（开发模式）
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
