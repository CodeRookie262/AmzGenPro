/**
 * 全局导航栏组件
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Image, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const NavigationBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isUserPanel = location.pathname === '/';
  const isAdminPanel = location.pathname === '/admin';

  return (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-1 border border-gray-200 flex gap-1 items-center">
      {/* Current User Info */}
      <div className="px-3 py-1 text-xs text-gray-600 flex items-center gap-2 mr-2 border-r border-gray-200">
        <span className="text-lg">{user.avatar || '👤'}</span>
        <span className="font-medium">{user.name}</span>
      </div>

      {/* View Switcher (only show for admin) */}
      {user.role === UserRole.ADMIN && (
        <>
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
              isUserPanel
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Image className="w-4 h-4" /> 生成器
          </button>
          <button
            onClick={() => navigate('/admin')}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
              isAdminPanel
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" /> 后台管理
          </button>
        </>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ml-1"
        title="退出登录"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

