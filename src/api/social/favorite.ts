import { api, PaginatedResponse } from '../core/client';
import type { Post } from '@/types';

/**
 * 收藏夹类型
 */
export interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isDefault: boolean;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 收藏记录类型
 */
export interface Favorite {
  id: string;
  userId: string;
  postId: string;
  folderId: string;
  note?: string;
  createdAt: string;
  post: Post;
}

/**
 * 创建收藏夹请求
 */
export interface CreateFolderDto {
  name: string; // 必填，<=50 字符
  description?: string; // 可选，<=200 字符
}

/**
 * 更新收藏夹请求
 */
export interface UpdateFolderDto {
  name?: string; // 可选，<=50 字符
  description?: string; // 可选，<=200 字符
}

/**
 * 收藏帖子请求
 */
export interface CreateFavoriteDto {
  postId: string; // 必填，帖子 UUID
  folderId: string; // 必填，收藏夹 UUID（必须属于当前用户）
  note?: string; // 可选，备注 <=500 字符
}

/**
 * 收藏相关 API（模块：Favorites）
 */
export const favoriteApi = {
  /**
   * 创建收藏夹
   * POST /favorites/folders
   */
  createFolder: (data: CreateFolderDto) => {
    return api.post<FavoriteFolder>('/favorites/folders', data);
  },

  /**
   * 获取收藏夹列表
   * GET /favorites/folders
   */
  getFolders: (page = 1, limit = 20) => {
    return api.get<PaginatedResponse<FavoriteFolder>>('/favorites/folders', {
      params: { page, limit },
    });
  },

  /**
   * 获取收藏夹详情
   * GET /favorites/folders/:id
   */
  getFolder: (folderId: string) => {
    return api.get<FavoriteFolder>(`/favorites/folders/${folderId}`);
  },

  /**
   * 更新收藏夹
   * PATCH /favorites/folders/:id
   */
  updateFolder: (folderId: string, data: UpdateFolderDto) => {
    return api.patch<FavoriteFolder>(`/favorites/folders/${folderId}`, data);
  },

  /**
   * 删除收藏夹
   * DELETE /favorites/folders/:id
   */
  deleteFolder: (folderId: string) => {
    return api.delete<{ message: string }>(`/favorites/folders/${folderId}`);
  },

  /**
   * 收藏帖子
   * POST /favorites
   */
  createFavorite: (data: CreateFavoriteDto) => {
    return api.post<Favorite>('/favorites', data);
  },

  /**
   * 取消收藏
   * DELETE /favorites/:id
   */
  deleteFavorite: (favoriteId: string) => {
    return api.delete<{ message: string }>(`/favorites/${favoriteId}`);
  },

  /**
   * 获取收藏夹中的帖子列表
   * GET /favorites/folders/:folderId/posts
   */
  getFolderPosts: (folderId: string, page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Favorite>>(`/favorites/folders/${folderId}/posts`, {
      params: { page, limit },
    });
  },
};
