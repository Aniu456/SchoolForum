/**
 * 拼车拼单类型定义
 */

// 拼车拼单类型
export type CarpoolType = 
  | 'CARPOOL'         // 拼车
  | 'FOOD_ORDER'      // 拼外卖
  | 'SHOPPING'        // 拼购物
  | 'TICKET'          // 拼票
  | 'OTHER';          // 其他

// 状态
export type CarpoolStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'COMPLETED';

/**
 * 拼车拼单信息
 */
export interface CarpoolItem {
  id: string;
  type: CarpoolType;
  title: string;
  description: string;
  departureLocation?: string;
  arrivalLocation?: string;
  departureTime?: string;
  totalSeats?: number;
  occupiedSeats: number;
  pricePerPerson?: number;
  deadline?: string;
  status: CarpoolStatus;
  contactInfo: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
  isAnonymous: boolean;
  organizerId: string;
  organizer?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  participants: Array<{
    id: string;
    userId: string;
    username?: string;
    nickname?: string;
    joinedAt: string;
  }>;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建拼车拼单请求
 */
export interface CreateCarpoolRequest {
  type: CarpoolType;
  title: string;
  description: string;
  departureLocation?: string;
  arrivalLocation?: string;
  departureTime?: string;
  totalSeats?: number;
  pricePerPerson?: number;
  deadline?: string;
  contactInfo: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
  isAnonymous?: boolean;
}

/**
 * 更新拼车拼单请求
 */
export interface UpdateCarpoolRequest {
  title?: string;
  description?: string;
  departureLocation?: string;
  arrivalLocation?: string;
  departureTime?: string;
  totalSeats?: number;
  pricePerPerson?: number;
  deadline?: string;
  status?: CarpoolStatus;
  contactInfo?: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
}

/**
 * 拼车拼单查询参数
 */
export interface CarpoolQueryParams {
  page?: number;
  limit?: number;
  type?: CarpoolType;
  status?: CarpoolStatus;
  sortBy?: 'createdAt' | 'departureTime' | 'viewCount';
  order?: 'asc' | 'desc';
  q?: string;
}

/**
 * 加入拼车拼单请求
 */
export interface JoinCarpoolRequest {
  carpoolId: string;
  message?: string;
}

