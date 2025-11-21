import { api } from '../core/client';
import type { Post } from '@/types';

/**
 * 标签统计
 */
export interface TagStats {
  tag: string;
  count: number;
  score?: number;
}

/**
 * 算法相关 API
 */
export const algorithmsApi = {
  /**
   * 获取热门帖子（Reddit算法）
   * GET /algorithms/hot-posts
   */
  getHotPosts: (limit: number = 20) => {
    return api.get<Post[]>('/algorithms/hot-posts', {
      params: { limit },
    });
  },

  /**
   * 获取趋势帖子
   * GET /algorithms/trending-posts
   */
  getTrendingPosts: (limit: number = 20) => {
    return api.get<Post[]>('/algorithms/trending-posts', {
      params: { limit },
    });
  },

  /**
   * 获取优质帖子
   * GET /algorithms/quality-posts
   */
  getQualityPosts: (limit: number = 20) => {
    return api.get<Post[]>('/algorithms/quality-posts', {
      params: { limit },
    });
  },

  /**
   * 获取热门标签
   * GET /algorithms/hot-tags
   */
  getHotTags: (limit: number = 50) => {
    return api.get<TagStats[]>('/algorithms/hot-tags', {
      params: { limit },
    });
  },

  /**
   * 获取趋势标签
   * GET /algorithms/trending-tags
   */
  getTrendingTags: (limit: number = 30) => {
    return api.get<TagStats[]>('/algorithms/trending-tags', {
      params: { limit },
    });
  },

  /**
   * 搜索标签
   * GET /algorithms/search-tags
   */
  searchTags: (query: string, limit: number = 20) => {
    return api.get<TagStats[]>('/algorithms/search-tags', {
      params: { q: query, limit },
    });
  },

  /**
   * 获取相关标签
   * GET /algorithms/related-tags
   */
  getRelatedTags: (tags: string[], limit: number = 10) => {
    return api.get<TagStats[]>('/algorithms/related-tags', {
      params: { tags: tags.join(','), limit },
    });
  },
};
