import { api } from '../core/client';

/**
 * 点赞切换请求
 */
export interface ToggleLikeDto {
  targetId: string; // 必填，UUID
  targetType: 'POST' | 'COMMENT'; // 必填，目标类型
}

/**
 * 点赞响应（根据 API.md 文档）
 */
export interface ToggleLikeResponse {
  action: 'liked' | 'unliked'; // 动作类型
  likeCount: number; // 当前的点赞数
}

/**
 * 点赞相关 API（模块：Likes）
 */
export const likeApi = {
  /**
   * 点赞 / 取消点赞切换
   * POST /likes/toggle
   */
  toggleLike: (data: ToggleLikeDto) => {
    return api.post<ToggleLikeResponse>('/likes/toggle', data);
  },
};
