/**
 * 关注 API
 */
import { api } from '../core/client';
import type { User, PaginatedResponse } from '@/types';

export interface FollowResponse {
  success: boolean;
  message?: string;
}

export interface FollowQueryParams {
  page?: number;
  limit?: number;
}

const followApi = {
  /**
   * 关注用户
   */
  followUser: async (userId: string): Promise<FollowResponse> => {
    return await api.post(`/users/${userId}/follow`);
  },

  /**
   * 取消关注
   */
  unfollowUser: async (userId: string): Promise<FollowResponse> => {
    return await api.delete(`/users/${userId}/follow`);
  },

  /**
   * 获取关注列表
   */
  getFollowing: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    return await api.get(`/users/${userId}/following`, { params });
  },

  /**
   * 获取粉丝列表
   */
  getFollowers: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    return await api.get(`/users/${userId}/followers`, { params });
  },

  /**
   * 检查是否关注
   */
  checkFollowing: async (userId: string): Promise<{ isFollowing: boolean }> => {
    return await api.get(`/users/${userId}/follow/status`);
  },

  /**
   * 获取互相关注列表（好友）
   */
  getMutualFollows: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    return await api.get(`/users/${userId}/mutual-follows`, { params });
  },
};

export default followApi;

