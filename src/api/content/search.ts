import { api, PaginatedResponse } from '../core/client';
import type { Post, User } from '@/types';

/**
 * 搜索帖子参数
 */
export interface SearchPostsParams {
  q: string; // 必填，搜索关键词
  page?: number; // 默认 1
  limit?: number; // 默认 20
  sortBy?: 'relevance' | 'createdAt' | 'viewCount'; // 默认 relevance
  tag?: string; // 可选，按标签过滤
}

/**
 * 搜索用户参数
 */
export interface SearchUsersParams {
  q: string; // 必填，关键词
  page?: number; // 默认 1
  limit?: number; // 默认 20
}

/**
 * 热门标签
 */
export interface PopularTag {
  tag: string;
  count: number;
}

/**
 * 搜索相关 API（模块：Search）
 */
export const searchApi = {
  /**
   * 搜索帖子（公开）
   * GET /search/posts
   */
  searchPosts: (params: SearchPostsParams) => {
    return api.get<PaginatedResponse<Post> & { meta: { query: string } }>('/search/posts', {
      params,
    });
  },

  /**
   * 搜索用户（公开）
   * GET /search/users
   */
  searchUsers: (params: SearchUsersParams) => {
    return api.get<PaginatedResponse<User> & { meta: { query: string } }>('/search/users', {
      params,
    });
  },

  /**
   * 获取热门标签（公开）
   * GET /search/tags/popular
   */
  getPopularTags: (limit = 10) => {
    return api.get<PopularTag[]>('/search/tags/popular', {
      params: { limit },
    });
  },
};
