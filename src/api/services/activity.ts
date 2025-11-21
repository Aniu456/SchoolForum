/**
 * 用户动态 API
 * 聚合关注用户的所有活动：新帖子、新评论、公告等
 */
import { api, PaginatedResponse } from '../core/client';

// 动态流数据类型
export interface ActivityItem {
  type: 'POST' | 'COMMENT' | 'ANNOUNCEMENT';
  id: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  data: any; // 完整的帖子/评论/公告数据
}

const activityApi = {
  /**
   * 获取关注用户的动态流
   * 包括：关注用户发布的新帖子、新评论、新公告等
   * GET /activities/following
   */
  getFollowingActivities: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ActivityItem>> => {
    return await api.get('/activities/following', { params });
  },

  /**
   * 获取我的动态
   * 包括：我发布的帖子、我发表的评论
   * GET /activities/me
   */
  getMyActivities: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ActivityItem>> => {
    return await api.get('/activities/me', { params });
  },
};

export default activityApi;
