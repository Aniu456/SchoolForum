import { api } from '../core/client';
import type { User } from '@/types';

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

/**
 * 管理员注册请求
 */
export interface RegisterAdminRequest extends RegisterRequest {
  adminSecret: string; // 管理员密钥（环境变量配置）
}

/**
 * 认证响应
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 忘记密码请求
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * 认证相关 API（模块：Auth）
 */
export const authApi = {
  /**
   * 用户注册（公开）
   * POST /auth/register
   */
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  /**
   * 管理员注册（公开，需管理员密钥）
   * POST /auth/register-admin
   */
  registerAdmin: (data: RegisterAdminRequest) =>
    api.post<AuthResponse>('/auth/register-admin', data),

  /**
   * 用户登录（公开）
   * POST /auth/login
   */
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  /**
   * 登出（需要认证）
   * POST /auth/logout
   */
  logout: () =>
    api.post<{ message: string }>('/auth/logout'),

  /**
   * 刷新令牌（公开）
   * POST /auth/refresh
   */
  refreshToken: (data: RefreshTokenRequest) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', data),

  /**
   * 忘记密码 - 发送验证码（公开）
   * POST /auth/forgot-password
   */
  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  /**
   * 重置密码（公开）
   * POST /auth/reset-password
   */
  resetPassword: (data: ResetPasswordRequest) =>
    api.post<{ message: string }>('/auth/reset-password', data),
};
