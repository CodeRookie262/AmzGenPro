/**
 * 认证上下文 - 管理用户认证状态
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { backendAuth } from '../services/backendService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (name: string, password: string) => Promise<{ user: User }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false); // 防止重复请求

  // 检查当前用户
  useEffect(() => {
    const checkAuth = async () => {
      // 如果正在加载，直接返回
      if (loadingRef.current) return;
      
      loadingRef.current = true;
      try {
        const currentUser = await backendAuth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
        setUser(null);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };
    checkAuth();
  }, []);

  const login = async (name: string, password: string) => {
    try {
      const response = await backendAuth.login(name, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    backendAuth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

