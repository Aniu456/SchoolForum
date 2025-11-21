import { api, PaginatedResponse } from '../core/client';

/**
 * 积分信息
 */
export interface PointsInfo {
  id: string;
  userId: string;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 积分历史记录
 */
export interface PointsHistory {
  id: string;
  action: string;
  points: number;
  reason: string;
  relatedId: string;
  createdAt: string;
}

/**
 * 积分排行榜项
 */
export interface LeaderboardItem {
  userId: string;
  totalPoints: number;
  level: number;
  rank: number;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
}

/**
 * 积分历史查询参数
 */
export interface PointsHistoryParams {
  page?: number;
  limit?: number;
}

/**
 * 积分相关 API
 */
export const pointsApi = {
  /**
   * 获取我的积分
   * GET /points/me
   */
  getMyPoints: () => {
    return api.get<PointsInfo>('/points/me');
  },

  /**
   * 获取积分历史
   * GET /points/history
   */
  getHistory: (params?: PointsHistoryParams) => {
    return api.get<PaginatedResponse<PointsHistory>>('/points/history', { params });
  },

  /**
   * 获取积分排行榜
   * GET /points/leaderboard
   */
  getLeaderboard: (limit: number = 50) => {
    return api.get<LeaderboardItem[]>('/points/leaderboard', {
      params: { limit },
    });
  },
};
