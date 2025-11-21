/**
 * 用户动态相关类型定义
 * 根据功能设计文档第23行：显示关注用户的新帖子和收到的新评论
 */

// ============================================
// 动态类型
// ============================================

/**
 * 动态类型枚举
 */
export type ActivityType =
  | 'NEW_POST' // 关注的用户发布了新帖子
  | 'NEW_COMMENT' // 我的帖子收到了新评论
  | 'NEW_REPLY'; // 我的评论收到了新回复

/**
 * 用户动态
 */
export interface UserActivity {
  id: string;
  type: ActivityType;
  createdAt: string;
  // 根据类型，可能有不同的关联数据
  post?: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      username: string;
      nickname: string;
      avatar?: string;
    };
    createdAt: string;
  };
  comment?: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      nickname: string;
      avatar?: string;
    };
    post: {
      id: string;
      title: string;
    };
    createdAt: string;
  };
}

/**
 * 用户动态列表响应
 */
export interface UserActivitiesResponse {
  data: UserActivity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
