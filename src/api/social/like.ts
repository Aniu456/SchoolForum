import { api } from '../core/client';

/**
 * 点赞切换请求
 */
export interface ToggleLikeDto {
  targetId: string; // 必填，UUID
  targetType: 'POST' | 'COMMENT'; // 必填，枚举 TargetType
}

/**
 * 点赞响应
 */
export interface ToggleLikeResponse {
  isLiked: boolean;
  likeCount: number;
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
