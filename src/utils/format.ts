/**
 * 日期格式化工具
 */

/**
 * 格式化时间为相对时间（如：刚刚、5分钟前、2小时前）
 * 别名: formatTime
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(targetDate.getTime())) return '';

  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}

// 别名导出
export const formatTime = formatRelativeTime;

/**
 * 格式化日期为标准格式（YYYY-MM-DD HH:mm:ss）
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(targetDate.getTime())) return '';

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const hours = String(targetDate.getHours()).padStart(2, '0');
  const minutes = String(targetDate.getMinutes()).padStart(2, '0');
  const seconds = String(targetDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期为简短格式（YYYY-MM-DD）
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(targetDate.getTime())) return '';

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化大数字（如：1.2K、3.5M）
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
