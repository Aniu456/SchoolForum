import { api, PaginatedResponse, AlternatePaginatedResponse } from '../core/client';
import type { User, Post } from '@/types';

/**
 * 用户认证响应
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * 登录请求
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  studentId?: string;
  nickname?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

/**
 * 管理员注册请求
 */
export interface RegisterAdminDto extends RegisterDto {
  adminKey: string;
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * 更新用户资料请求
 */
export interface UpdateUserDto {
  nickname?: string;
  bio?: string;
  avatar?: string;
}

/**
 * 用户详情响应
 */
export interface UserDetailResponse {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  // 兼容旧代码
  stats?: {
    postCount: number;
    followerCount: number;
    followingCount: number;
  };
  followersCount?: number; // 别名
  followers?: number; // 别名
  following?: number; // 别名
  email?: string; // 某些接口返回
}

/**
 * 关注用户请求
 */
export interface CreateFollowDto {
  followingId: string;
}

/**
 * 用户（带关注数）
 */
export interface UserWithFollowCounts {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  role: string;
  followerCount: number;
  followingCount: number;
}

/**
 * 认证相关 API（模块：Auth）
 */
export const authApi = {
  /**
   * 用户注册（公开）
   * POST /auth/register
   */
  register: (data: RegisterDto) => {
    return api.post<AuthResponse>('/auth/register', data);
  },

  /**
   * 管理员注册（公开，需管理员密钥）
   * POST /auth/register-admin
   */
  registerAdmin: (data: RegisterAdminDto) => {
    return api.post<AuthResponse>('/auth/register-admin', data);
  },

  /**
   * 用户登录（公开）
   * POST /auth/login
   */
  login: (data: LoginDto) => {
    return api.post<AuthResponse>('/auth/login', data);
  },

  /**
   * 刷新令牌（公开）
   * POST /auth/refresh
   */
  refreshToken: (data: RefreshTokenDto) => {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', data);
  },

  /**
   * 登出
   * POST /auth/logout
   */
  logout: () => {
    return api.post<{ message: string }>('/auth/logout');
  },
};

/**
 * 用户相关 API（模块：Users）
 */
export const userApi = {
  /**
   * 获取当前用户资料
   * GET /users/me
   */
  getCurrentUser: () => {
    return api.get<User>('/users/me');
  },

  /**
   * 更新当前用户资料
   * PATCH /users/me
   */
  updateProfile: (data: UpdateUserDto) => {
    return api.patch<User>('/users/me', data);
  },

  /**
   * 获取指定用户详情
   * GET /users/:id
   */
  getUser: (userId: string) => {
    return api.get<UserDetailResponse>(`/users/${userId}`);
  },

  /**
   * 获取用户发帖列表
   * GET /users/:id/posts
   */
  getUserPosts: (userId: string, page = 1, limit = 20) => {
    return api.get<AlternatePaginatedResponse<Post>>(`/users/${userId}/posts`, {
      params: { page, limit },
    });
  },

  /**
   * 获取用户点赞列表（公开）
   * GET /users/:id/likes
   */
  getUserLikes: (userId: string, page = 1, limit = 20) => {
    return api.get<PaginatedResponse<any>>(`/users/${userId}/likes`, {
      params: { page, limit },
    });
  },
};

/**
 * 关注相关 API（模块：Follows）
 */
export const followApi = {
  /**
   * 关注用户
   * POST /users/:id/follow
   */
  followUser: (userId: string) => {
    return api.post<{ message: string; followingId: string }>(`/users/${userId}/follow`, {
      followingId: userId,
    });
  },

  /**
   * 取消关注
   * DELETE /users/:id/follow
   */
  unfollowUser: (userId: string) => {
    return api.delete<{ message: string; followingId: string }>(`/users/${userId}/follow`);
  },

  /**
   * 获取用户的关注列表
   * GET /users/:id/following
   */
  getFollowing: (userId: string, page = 1, limit = 20) => {
    return api.get<PaginatedResponse<UserWithFollowCounts>>(`/users/${userId}/following`, {
      params: { page, limit },
    });
  },

  /**
   * 获取用户的粉丝列表
   * GET /users/:id/followers
   */
  getFollowers: (userId: string, page = 1, limit = 20) => {
    return api.get<PaginatedResponse<UserWithFollowCounts>>(`/users/${userId}/followers`, {
      params: { page, limit },
    });
  },
};
