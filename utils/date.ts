/**
 * 日期时间工具函数
 */

/**
 * 获取当前时间戳（毫秒）
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * 获取当前时间戳（秒）
 */
export const getCurrentTimestampSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * 时间戳转日期字符串
 */
export const timestampToDateString = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

/**
 * 时间戳转日期时间字符串
 */
export const timestampToDateTimeString = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

/**
 * 格式化日期时间（兼容formatDateTime）
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
 * 计算相对时间（如：2小时前）
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

