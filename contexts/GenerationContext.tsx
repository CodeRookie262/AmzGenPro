/**
 * 生成上下文 - 管理图片生成状态和历史
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { GeneratedImageResult } from '../types';
import { backendHistory } from '../services/backendService';
import { useAuth } from './AuthContext';

interface GenerationContextType {
  results: GeneratedImageResult[];
  isLoading: boolean;
  addResult: (result: GeneratedImageResult) => void;
  updateResult: (id: string, updates: Partial<GeneratedImageResult>) => void;
  removeResult: (id: string) => void;
  clearResults: () => void;
  loadHistory: () => Promise<void>;
  saveToHistory: (result: GeneratedImageResult) => Promise<void>;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export const GenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<GeneratedImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false); // 防止重复请求

  // 加载历史记录 - 改为按需加载，不在 Context 中自动加载
  const loadHistory = useCallback(async () => {
    if (!user?.id || loadingRef.current) return; // 如果正在加载，直接返回
    
    loadingRef.current = true;
    try {
      setIsLoading(true);
      const response = await backendHistory.getHistory(1, 100);
      setResults(response.history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // 当用户退出登录时，清空结果
  useEffect(() => {
    if (!user) {
      setResults([]);
    }
  }, [user]);

  const addResult = useCallback((result: GeneratedImageResult) => {
    setResults(prev => [result, ...prev]);
  }, []);

  const updateResult = useCallback((id: string, updates: Partial<GeneratedImageResult>) => {
    setResults(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const removeResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // 自动保存到历史记录
  const saveToHistory = useCallback(async (result: GeneratedImageResult) => {
    if (!user || !result.imageUrl || result.loading || result.savedToBackend) {
      return;
    }

    try {
      const historyId = await backendHistory.createHistory({
        definitionId: result.definitionId,
        definitionName: result.definitionName,
        sourceImageUrl: result.sourceImage,
        generatedImageUrl: result.imageUrl,
        prompt: result.optimizedPrompt,
        optimizedPrompt: result.optimizedPrompt,
        model: result.model,
        maskId: '', // 需要从外部传入
      } as any);

      updateResult(result.id, { savedToBackend: true, historyId });
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, [user, updateResult]);

  return (
    <GenerationContext.Provider
      value={{
        results,
        isLoading,
        addResult,
        updateResult,
        removeResult,
        clearResults,
        loadHistory,
        saveToHistory,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
};

export const useGeneration = (): GenerationContextType => {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
};

