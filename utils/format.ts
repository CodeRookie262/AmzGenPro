/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 格式化时间（仅时间部分）
 */
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 截断文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * 提取模型名称（简化显示）
 */
export const getModelDisplayName = (model: string): string => {
  if (!model) return 'Unknown';
  // 提取最后一部分作为显示名称
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
};

