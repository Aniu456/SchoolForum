/**
 * 用户动态相关 Hooks
 */
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '@/api';

// ============================================
// Query Keys
// ============================================
export const activityKeys = {
  all: ['activities'] as const,
  myActivities: () => [...activityKeys.all, 'my'] as const,
};

// ============================================
// 用户动态 Hooks
// ============================================

/**
 * 获取我的动态
 * 包括：关注用户的新帖子、我收到的新评论等
 */
export const useMyActivities = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...activityKeys.myActivities(), params],
    queryFn: () => activityApi.getMyActivities(params),
  });
};
