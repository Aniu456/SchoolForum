/**
 * 关注 API
 */
import client from '../core/client';
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
    const response = await client.post(`/users/${userId}/follow`);
    return response.data;
  },

  /**
   * 取消关注
   */
  unfollowUser: async (userId: string): Promise<FollowResponse> => {
    const response = await client.delete(`/users/${userId}/follow`);
    return response.data;
  },

  /**
   * 获取关注列表
   */
  getFollowing: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await client.get(`/users/${userId}/following`, { params });
    return response.data;
  },

  /**
   * 获取粉丝列表
   */
  getFollowers: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await client.get(`/users/${userId}/followers`, { params });
    return response.data;
  },

  /**
   * 检查是否关注
   */
  checkFollowing: async (userId: string): Promise<{ isFollowing: boolean }> => {
    const response = await client.get(`/users/${userId}/follow/status`);
    return response.data;
  },

  /**
   * 获取互相关注列表（好友）
   */
  getMutualFollows: async (userId: string, params?: FollowQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await client.get(`/users/${userId}/mutual-follows`, { params });
    return response.data;
  },
};

export default followApi;

