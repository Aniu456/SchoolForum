import { api, PaginatedResponse } from '../core/client';
import type { Comment } from '@/types';

/**
 * 创建评论或回复请求
 */
export interface CreateCommentDto {
  postId: string; // 必填，UUID 帖子 ID
  content: string; // 必填，1-1000 字符
  parentId?: string; // 可选，UUID 父评论 ID；不传表示一级评论
}

/**
 * 评论相关 API（模块：Comments）
 */
export const commentApi = {
  /**
   * 创建评论或回复
   * POST /comments
   */
  createComment: (data: CreateCommentDto) => {
    // 移除 undefined 的字段，避免发送到服务器
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as CreateCommentDto;
    return api.post<Comment>('/comments', cleanData);
  },

  /**
   * 获取评论的所有回复（分页）
   * GET /comments/:id/replies
   */
  getReplies: (commentId: string, page = 1, limit = 20) => {
    return api.get<PaginatedResponse<Comment>>(`/comments/${commentId}/replies`, {
      params: { page, limit },
    });
  },

  /**
   * 删除评论
   * DELETE /comments/:id
   */
  deleteComment: (commentId: string) => {
    return api.delete<{ message: string }>(`/comments/${commentId}`);
  },
};
