import { api, PaginatedResponse } from './client';
import type { User } from '@/types';

/**
 * 举报目标类型
 */
export type ReportTarget = 'POST' | 'COMMENT' | 'USER';

/**
 * 举报状态
 */
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 创建举报请求
 */
export interface CreateReportDto {
  targetId: string; // 必填，被举报对象 ID
  targetType: ReportTarget; // 必填，枚举 ReportTarget
  reason: string; // 必填，>=5 字符
}

/**
 * 举报记录
 */
export interface Report {
  id: string;
  targetId: string;
  targetType: ReportTarget;
  reporterId: string;
  reporter?: User;
  reason: string;
  status: ReportStatus;
  handlerId?: string;
  handler?: User;
  handleNote?: string;
  createdAt: string;
  handledAt?: string;
}

/**
 * 处理举报请求
 */
export interface HandleReportDto {
  status: ReportStatus; // 必填，ReportStatus 枚举
  handleNote?: string; // 可选，处理备注
}

/**
 * 系统统计
 */
export interface SystemStatistics {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
}

/**
 * 管理员相关 API（模块：Admin）
 */
export const adminApi = {
  /**
   * 获取举报列表（管理员）
   * GET /admin/reports
   */
  getReports: (params?: {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    targetType?: ReportTarget;
  }) => {
    return api.get<PaginatedResponse<Report>>('/admin/reports', { params });
  },

  /**
   * 处理举报（管理员）
   * PATCH /admin/reports/:id
   */
  handleReport: (reportId: string, data: HandleReportDto) => {
    return api.patch<Report>(`/admin/reports/${reportId}`, data);
  },

  /**
   * 获取用户列表（管理员）
   * GET /admin/users
   */
  getUsers: (params?: { page?: number; limit?: number; role?: string; isBanned?: boolean }) => {
    return api.get<PaginatedResponse<User>>('/admin/users', { params });
  },

  /**
   * 封禁用户（管理员）
   * POST /admin/users/:id/ban
   */
  banUser: (userId: string) => {
    return api.post<{ message: string }>(`/admin/users/${userId}/ban`);
  },

  /**
   * 解封用户（管理员）
   * POST /admin/users/:id/unban
   */
  unbanUser: (userId: string) => {
    return api.post<{ message: string }>(`/admin/users/${userId}/unban`);
  },

  /**
   * 获取系统统计（管理员）
   * GET /admin/statistics
   */
  getStatistics: () => {
    return api.get<SystemStatistics>('/admin/statistics');
  },
};

/**
 * 举报相关 API（普通用户）
 */
export const reportApi = {
  /**
   * 创建举报（普通用户）
   * POST /reports
   */
  createReport: (data: CreateReportDto) => {
    return api.post<Report>('/reports', data);
  },
};
