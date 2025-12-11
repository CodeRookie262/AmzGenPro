/**
 * 面具上下文 - 管理产品面具数据
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ProductMask } from '../types';
import { backendMasks } from '../services/backendService';

interface MaskContextType {
  masks: ProductMask[];
  isLoading: boolean;
  error: string | null;
  refreshMasks: () => Promise<void>;
  getMaskById: (id: string) => ProductMask | undefined;
}

const MaskContext = createContext<MaskContextType | undefined>(undefined);

export const MaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [masks, setMasks] = useState<ProductMask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // 防止重复请求

  const loadMasks = async () => {
    // 如果正在加载，直接返回
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      const loadedMasks = await backendMasks.getMasks();
      setMasks(loadedMasks);
    } catch (err: any) {
      console.error('Failed to load masks:', err);
      setError(err.message || '加载面具失败');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadMasks();
  }, []);

  const getMaskById = (id: string): ProductMask | undefined => {
    return masks.find(m => m.id === id);
  };

  return (
    <MaskContext.Provider
      value={{
        masks,
        isLoading,
        error,
        refreshMasks: loadMasks,
        getMaskById,
      }}
    >
      {children}
    </MaskContext.Provider>
  );
};

export const useMasks = (): MaskContextType => {
  const context = useContext(MaskContext);
  if (!context) {
    throw new Error('useMasks must be used within MaskProvider');
  }
  return context;
};

