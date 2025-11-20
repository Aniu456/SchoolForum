import { api, PaginatedResponse } from '../core/client';
import type { Post } from '@/types';

/**
 * 话题类型
 */
export interface Topic {
  id: string;
  name: string;
  description?: string;
  postCount: number;
  isHot: boolean;
  createdAt: string;
}

/**
 * 推荐相关 API（模块：Recommendations）
 */
export const recommendationApi = {
  /**
   * 热门帖子（公开）
   * GET /recommendations/posts/hot
   */
  getHotPosts: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Post>>('/recommendations/posts/hot', {
      params: { page, limit },
    });
  },

  /**
   * 趋势帖子（新晋热门，公开）
   * GET /recommendations/posts/trending
   */
  getTrendingPosts: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Post>>('/recommendations/posts/trending', {
      params: { page, limit },
    });
  },

  /**
   * 最新帖子（公开）
   * GET /recommendations/posts/latest
   */
  getLatestPosts: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Post>>('/recommendations/posts/latest', {
      params: { page, limit },
    });
  },

  /**
   * 个性化推荐（关注关系）
   * GET /recommendations/personalized
   */
  getPersonalizedPosts: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Post>>('/recommendations/personalized', {
      params: { page, limit },
    });
  },

  /**
   * 热门话题（公开）
   * GET /recommendations/topics/hot
   */
  getHotTopics: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Topic>>('/recommendations/topics/hot', {
      params: { page, limit },
    });
  },

  /**
   * 所有话题（公开）
   * GET /recommendations/topics
   */
  getAllTopics: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Topic>>('/recommendations/topics', {
      params: { page, limit },
    });
  },
};
