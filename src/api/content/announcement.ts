import { api, PaginatedResponse } from '../core/client';

/**
 * 公告类型
 */
export type AnnouncementType = 'INFO' | 'WARNING' | 'URGENT';

/**
 * 公告
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isPinned: boolean;
  publishedAt: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 公告列表查询参数
 */
export interface AnnouncementListParams {
  page?: number; // 默认 1
  limit?: number; // 默认 20
}

/**
 * 创建公告请求（仅管理员）
 */
export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type: AnnouncementType;
  targetRole?: 'USER' | 'ADMIN';
  isPinned?: boolean;
  isPublished?: boolean;
}

/**
 * 公告相关 API（模块：Announcements）
 * 注：管理员专用接口在单独的管理后台系统中实现
 */
export const announcementApi = {
  /**
   * 获取公告列表（公开）
   * GET /announcements
   */
  getAnnouncements: (params?: AnnouncementListParams) => {
    return api.get<PaginatedResponse<Announcement>>('/announcements', { params });
  },

  /**
   * 获取公告详情（公开）
   * GET /announcements/:id
   */
  getAnnouncement: (announcementId: string) => {
    return api.get<Announcement>(`/announcements/${announcementId}`);
  },
};

