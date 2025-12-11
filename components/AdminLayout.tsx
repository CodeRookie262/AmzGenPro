/**
 * 管理面板布局组件 - 处理路由导航
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPanel } from './AdminPanel';
import { User } from '../types';

interface AdminLayoutProps {
  currentUser: User;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  return <AdminPanel currentUser={currentUser} onBack={() => navigate('/')} />;
};

