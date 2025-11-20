/**
 * 头像工具函数
 */

/**
 * 生成默认头像 URL（使用 UI Avatars 服务）
 */
export function getDefaultAvatar(name: string, size = 200): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=random&color=fff&bold=true`;
}

/**
 * 获取头像 URL，如果没有则返回默认头像
 */
export function getAvatarUrl(avatar?: string, name = 'User', size = 200): string {
  if (avatar) {
    return avatar;
  }
  return getDefaultAvatar(name, size);
}

// 别名导出
export const getFallbackAvatarUrl = getDefaultAvatar;

/**
 * 从用户名提取首字母用于头像
 */
export function getInitials(name: string): string {
  if (!name) return 'U';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
