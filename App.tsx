import React, { useState } from 'react';
import { UserPanel } from './components/UserPanel';
import { AdminPanel } from './components/AdminPanel';
import { Settings, Image } from 'lucide-react';

enum View {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.USER);

  return (
    <div className="relative">
      {/* Global Navigation Switcher (Floating or Fixed) */}
      <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-1 border border-gray-200 flex gap-1">
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
      </div>

      {currentView === View.USER ? (
        <UserPanel />
      ) : (
        <AdminPanel onBack={() => setCurrentView(View.USER)} />
      )}
    </div>
  );
};

export default App;