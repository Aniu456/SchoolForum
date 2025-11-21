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
 * 获取关注用户的动态流
 * 包括：关注用户发布的新帖子、新评论、新公告等
 */
export const useFollowingActivities = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...activityKeys.all, 'following', params],
    queryFn: () => activityApi.getFollowingActivities(params),
  });
};

/**
 * 获取我的动态
 * 包括：我发布的帖子、我发表的评论
 */
export const useMyActivities = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...activityKeys.myActivities(), params],
    queryFn: () => activityApi.getMyActivities(params),
  });
};
