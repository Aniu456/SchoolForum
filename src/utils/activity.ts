/**
 * 活动记录管理
 */
export interface Activity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'collect' | 'follow';
  userId: string;
  targetId: string;
  targetTitle?: string;
  targetType?: 'post' | 'comment' | 'user';
  content?: string;
  createdAt: string;
}

const ACTIVITY_KEY = 'forum_activity';
const MAX_ACTIVITY = 200;

/**
 * 添加活动记录
 */
export function addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): void {
  const activities = getUserActivities();

  const newActivity: Activity = {
    ...activity,
    id: `activity_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
  };

  activities.unshift(newActivity);

  // 限制活动记录数量
  const limited = activities.slice(0, MAX_ACTIVITY);

  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(limited));
}

/**
 * 获取用户活动记录
 */
export function getUserActivities(): Activity[] {
  try {
    const data = localStorage.getItem(ACTIVITY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load activities:', error);
    return [];
  }
}

// 别名导出
export const getActivities = getUserActivities;

/**
 * 获取特定类型的活动
 */
export function getActivitiesByType(type: Activity['type']): Activity[] {
  const activities = getUserActivities();
  return activities.filter((a) => a.type === type);
}

/**
 * 获取关注的用户的活动
 */
export function getFollowingActivities(_userId: string): Activity[] {
  // TODO: 这需要从后端获取关注用户列表
  // 暂时返回所有活动
  return getUserActivities();
}

/**
 * 清空活动记录
 */
export function clearActivities(): void {
  localStorage.removeItem(ACTIVITY_KEY);
}

/**
 * 获取活动图标
 */
export function getActivityIcon(type: Activity['type']): string {
  const icons: Record<Activity['type'], string> = {
    post: '📝',
    comment: '💬',
    like: '👍',
    collect: '⭐',
    follow: '👥',
  };
  return icons[type] || '📌';
}

/**
 * 获取活动文本描述
 */
export function getActivityText(activity: Activity): string {
  const texts: Record<Activity['type'], string> = {
    post: '发布了帖子',
    comment: '评论了',
    like: '点赞了',
    collect: '收藏了',
    follow: '关注了',
  };
  return texts[activity.type] || '进行了操作';
}
