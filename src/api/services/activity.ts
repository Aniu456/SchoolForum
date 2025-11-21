/**
 * 用户动态 API
 * 根据功能设计文档第23行：显示关注用户的新帖子和收到的新评论
 */
import apiClient from '../core/client';
import type { UserActivitiesResponse } from '@/types/activity';

const activityApi = {
  /**
   * 获取我的动态
   * 包括：
   * 1. 我关注的用户发布的新帖子
   * 2. 我的帖子收到的新评论
   * 3. 我的评论收到的新回复
   */
  getMyActivities: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<UserActivitiesResponse> => {
    const response = await apiClient.get('/users/me/activities', { params });
    return response.data;
  },
};

export default activityApi;
