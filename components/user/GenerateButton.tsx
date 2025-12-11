/**
 * 生成按钮组件
 */
import React from 'react';
import { Zap, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  disabled: boolean;
  isLoading: boolean;
  selectedCount: number;
  onClick: () => void;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  disabled,
  isLoading,
  selectedCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 rounded-md flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 fill-current text-orange-400" /> 开始生成 ({selectedCount})
        </>
      )}
    </button>
  );
};

