import { api, PaginatedResponse } from '../core/client';

/**
 * 公告优先级
 */
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * 公告类型
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 公告列表查询参数
 */
export interface AnnouncementListParams {
  page?: number; // 默认 1
  limit?: number; // 默认 20
}

/**
 * 公告相关 API（模块：Announcements）
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

