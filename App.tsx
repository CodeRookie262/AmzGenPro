/**
 * 主应用组件 - 使用React Router
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserPanel } from './components/UserPanel';
import { AdminLayout } from './components/AdminLayout';
import { LoginPanel } from './components/LoginPanel';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavigationBar } from './components/NavigationBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MaskProvider } from './contexts/MaskContext';
import { GenerationProvider } from './contexts/GenerationContext';
import { UserRole } from './types';

// 登录后重定向组件
const LoginRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (user) {
    // 已登录，根据角色重定向
    return <Navigate to={user.role === UserRole.ADMIN ? '/admin' : '/'} replace />;
  }

  return <LoginPanel />;
};

// 主路由组件
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {/* 全局导航栏（登录后显示） */}
      {user && <NavigationBar />}

      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<LoginRedirect />} />

        {/* 用户面板（生成器）- 需要登录 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user && <UserPanel currentUser={user} />}
            </ProtectedRoute>
          }
        />

        {/* 管理面板 - 需要管理员权限 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              {user && <AdminLayout currentUser={user} />}
            </ProtectedRoute>
          }
        />

        {/* 404 - 重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// 主应用组件（提供Context和Router）
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MaskProvider>
          <GenerationProvider>
            <AppRoutes />
          </GenerationProvider>
        </MaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
