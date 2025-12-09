import React, { useState, useEffect } from 'react';
import { UserPanel } from './components/UserPanel';
import { AdminPanel } from './components/AdminPanel';
import { LoginPanel } from './components/LoginPanel';
import { User, UserRole } from './types';
import { getCurrentUser, setCurrentUser } from './services/storageService';
import { Settings, Image, LogOut } from 'lucide-react';

enum View {
  LOGIN = 'LOGIN',
  USER = 'USER',
  ADMIN = 'ADMIN'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = getCurrentUser();
    if (savedUser) {
      setCurrentUserState(savedUser);
      setCurrentView(savedUser.role === UserRole.ADMIN ? View.ADMIN : View.USER);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUserState(user);
    setCurrentUser(user.id);
    setCurrentView(user.role === UserRole.ADMIN ? View.ADMIN : View.USER);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
    setCurrentView(View.LOGIN);
  };

  return (
    <div className="relative">
      {currentView === View.LOGIN ? (
        <LoginPanel onLogin={handleLogin} />
      ) : (
        <>
          {/* Global Navigation Bar */}
          <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-1 border border-gray-200 flex gap-1 items-center">
            {/* Current User Info */}
            <div className="px-3 py-1 text-xs text-gray-600 flex items-center gap-2 mr-2 border-r border-gray-200">
              <span className="text-lg">{currentUser?.avatar || '👤'}</span>
              <span className="font-medium">{currentUser?.name}</span>
            </div>

            {/* View Switcher (only show for admin) */}
            {currentUser?.role === UserRole.ADMIN && (
              <>
                <button
                  onClick={() => setCurrentView(View.USER)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    currentView === View.USER 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Image className="w-4 h-4" /> 生成器
                </button>
                <button
                  onClick={() => setCurrentView(View.ADMIN)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    currentView === View.ADMIN 
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

          {currentView === View.USER ? (
            <UserPanel currentUser={currentUser!} />
          ) : (
            <AdminPanel 
              currentUser={currentUser!}
              onBack={() => setCurrentView(View.USER)} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;