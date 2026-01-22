import { api, PaginatedResponse } from '../core/client';
import type { Post } from '@/types';

/**
 * 收藏记录类型
 */
export interface Favorite {
  id: string;
  userId: string;
  postId: string;
  note?: string;
  createdAt: string;
  post: Post;
}

/**
 * 收藏帖子请求
 */
export interface CreateFavoriteDto {
  postId: string; // 必填，帖子 UUID
  note?: string; // 可选，备注
}

/**
 * 切换收藏响应
 */
export interface ToggleFavoriteResponse {
  isFavorited: boolean;
  message: string;
}

/**
 * 收藏相关 API（模块：Favorites）
 */
export const favoriteApi = {
  /**
   * 收藏帖子
   * POST /favorites
   */
  createFavorite: (data: CreateFavoriteDto) => {
    return api.post<Favorite>('/favorites', data);
  },

  /**
   * 切换收藏状态（收藏/取消收藏）
   * POST /favorites/toggle
   */
  toggleFavorite: (postId: string) => {
    return api.post<ToggleFavoriteResponse>('/favorites/toggle', { postId });
  },

  /**
   * 获取用户收藏列表
   * GET /favorites
   */
  getFavorites: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Favorite>>('/favorites', {
      params: { page, limit },
    });
  },

  /**
   * 检查收藏状态
   * GET /favorites/check/:postId
   */
  checkFavorite: (postId: string) => {
    return api.get<{ isFavorited: boolean }>(`/favorites/check/${postId}`);
  },

  /**
   * 取消收藏（通过收藏ID）
   * DELETE /favorites/:id
   */
  deleteFavorite: (favoriteId: string) => {
    return api.delete<{ message: string }>(`/favorites/${favoriteId}`);
  },

  /**
   * 取消收藏（通过帖子ID）
   * DELETE /favorites/post/:postId
   */
  deleteFavoriteByPost: (postId: string) => {
    return api.delete<{ message: string }>(`/favorites/post/${postId}`);
  },
};
