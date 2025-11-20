import { api, PaginatedResponse } from '../core/client';

/**
 * 通知类型
 */
export type NotificationType = 'COMMENT' | 'REPLY' | 'LIKE' | 'SYSTEM' | 'FOLLOW';

/**
 * 通知
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string; // 关联对象 ID（帖子/评论等）
  isRead: boolean;
  createdAt: string;
}

/**
 * 通知列表参数
 */
export interface NotificationListParams {
  page?: number; // 默认 1
  limit?: number; // 默认 20
  isRead?: boolean; // 可选，字符串 "true" | "false"
  type?: NotificationType; // 可选，枚举 NotificationType
}

/**
 * 通知相关 API（模块：Notifications）
 */
export const notificationApi = {
  /**
   * 获取通知列表
   * GET /notifications
   */
  getNotifications: (params?: NotificationListParams) => {
    return api.get<PaginatedResponse<Notification>>('/notifications', { params });
  },

  /**
   * 获取未读通知数量
   * GET /notifications/unread/count
   */
  getUnreadCount: () => {
    return api.get<{ unreadCount: number }>('/notifications/unread/count');
  },

  /**
   * 标记单个通知为已读
   * PATCH /notifications/:id/read
   */
  markAsRead: (notificationId: string) => {
    return api.patch<Notification>(`/notifications/${notificationId}/read`);
  },

  /**
   * 全部标记为已读
   * POST /notifications/read-all
   */
  markAllAsRead: () => {
    return api.post<{ message: string; count: number }>('/notifications/read-all');
  },

  /**
   * 删除通知
   * DELETE /notifications/:id
   */
  deleteNotification: (notificationId: string) => {
    return api.delete<{ message: string }>(`/notifications/${notificationId}`);
  },
};
