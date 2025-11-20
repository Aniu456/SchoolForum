/**
 * 举报 API
 */
import client from '../core/client';
import type { PaginatedResponse } from '@/types';

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';

export interface Report {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reporterId: string;
  reporter?: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CreateReportRequest {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
}

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  report?: Report;
}

const reportApi = {
  /**
   * 创建举报
   */
  createReport: async (data: CreateReportRequest): Promise<ReportResponse> => {
    const response = await client.post('/reports', data);
    return response.data;
  },

  /**
   * 获取举报列表（管理员）
   */
  getReports: async (params?: ReportQueryParams): Promise<PaginatedResponse<Report>> => {
    const response = await client.get('/admin/reports', { params });
    return response.data;
  },

  /**
   * 获取举报详情（管理员）
   */
  getReport: async (reportId: string): Promise<Report> => {
    const response = await client.get(`/admin/reports/${reportId}`);
    return response.data;
  },

  /**
   * 处理举报 - 通过（管理员）
   */
  resolveReport: async (reportId: string, action: 'RESOLVE' | 'REJECT', note?: string): Promise<ReportResponse> => {
    const response = await client.post(`/admin/reports/${reportId}/resolve`, { action, note });
    return response.data;
  },

  /**
   * 获取我的举报记录
   */
  getMyReports: async (params?: ReportQueryParams): Promise<PaginatedResponse<Report>> => {
    const response = await client.get('/reports/my', { params });
    return response.data;
  },

  /**
   * 检查是否已举报
   */
  checkReported: async (targetId: string, targetType: ReportTargetType): Promise<{ hasReported: boolean }> => {
    const response = await client.get('/reports/check', { params: { targetId, targetType } });
    return response.data;
  },
};

export default reportApi;

