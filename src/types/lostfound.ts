/**
 * 失物招领类型定义
 */

// 物品类型
export type LostFoundType = 'LOST' | 'FOUND';

// 物品状态
export type LostFoundStatus = 'OPEN' | 'CLAIMED' | 'CLOSED';

// 物品分类
export type LostFoundCategory = 
  | 'ELECTRONICS'     // 电子产品
  | 'DOCUMENTS'       // 证件文件
  | 'KEYS'            // 钥匙
  | 'CARDS'           // 卡类
  | 'BAGS'            // 包类
  | 'CLOTHING'        // 衣物
  | 'BOOKS'           // 书籍
  | 'ACCESSORIES'     // 配饰
  | 'OTHER';          // 其他

/**
 * 失物招领信息
 */
export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  category: LostFoundCategory;
  title: string;
  description: string;
  images?: string[];
  location: string;
  lostOrFoundDate: string;
  status: LostFoundStatus;
  contactInfo: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
  isAnonymous: boolean;
  userId: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  claimedAt?: string;
}

/**
 * 创建失物招领请求
 */
export interface CreateLostFoundRequest {
  type: LostFoundType;
  category: LostFoundCategory;
  title: string;
  description: string;
  images?: string[];
  location: string;
  lostOrFoundDate: string;
  contactInfo: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
  isAnonymous?: boolean;
}

/**
 * 更新失物招领请求
 */
export interface UpdateLostFoundRequest {
  title?: string;
  description?: string;
  images?: string[];
  location?: string;
  lostOrFoundDate?: string;
  status?: LostFoundStatus;
  contactInfo?: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
}

/**
 * 失物招领查询参数
 */
export interface LostFoundQueryParams {
  page?: number;
  limit?: number;
  type?: LostFoundType;
  category?: LostFoundCategory;
  status?: LostFoundStatus;
  sortBy?: 'createdAt' | 'lostOrFoundDate';
  order?: 'asc' | 'desc';
  q?: string;
}

