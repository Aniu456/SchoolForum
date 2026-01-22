/**
 * 积分相关 API
 * @deprecated 后端已移除积分系统
 */

/**
 * 积分信息
 * @deprecated
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
 * @deprecated
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
 * @deprecated
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
 * @deprecated
 */
export interface PointsHistoryParams {
  page?: number;
  limit?: number;
}

const DEPRECATION_MESSAGE = '积分系统已废弃，可使用点赞数/粉丝数作为活跃度指标';

/**
 * 积分相关 API
 * @deprecated 积分系统已废弃，后端不再支持
 */
export const pointsApi = {
  /**
   * @deprecated
   */
  getMyPoints: async (): Promise<PointsInfo> => {
    console.warn('[pointsApi] ' + DEPRECATION_MESSAGE);
    // 返回默认值而不是抛错，避免破坏UI
    return {
      id: '',
      userId: '',
      totalPoints: 0,
      level: 1,
      nextLevelPoints: 100,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * @deprecated
   */
  getHistory: async (_params?: PointsHistoryParams) => {
    console.warn('[pointsApi] ' + DEPRECATION_MESSAGE);
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * @deprecated
   */
  getLeaderboard: async (_limit: number = 50): Promise<LeaderboardItem[]> => {
    console.warn('[pointsApi] ' + DEPRECATION_MESSAGE);
    return [];
  },
};
