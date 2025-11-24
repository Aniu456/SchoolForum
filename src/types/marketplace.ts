/**
 * 二手交易市场类型定义
 */

// 商品状态
export type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REMOVED';

// 商品分类
export type ItemCategory =
  | 'ELECTRONICS'      // 电子产品
  | 'BOOKS'           // 书籍教材
  | 'CLOTHING'        // 服装配饰
  | 'SPORTS'          // 运动器材
  | 'FURNITURE'       // 家具用品
  | 'STATIONERY'      // 文具用品
  | 'DAILY'           // 日用品
  | 'OTHER';          // 其他

// 商品成色
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';

// 交易方式
export type TradeMethod = 'MEET' | 'DELIVERY' | 'BOTH';

/**
 * 二手商品
 */
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ItemCategory;
  condition: ItemCondition;
  tradeMethod?: TradeMethod;
  images: string[];
  location?: string;
  contact: string;
  status: ItemStatus;
  sellerId: string;
  seller?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  soldAt?: string;
}

/**
 * 创建商品请求
 */
export interface CreateMarketplaceItemRequest {
  title: string;
  description: string;
  price: number;
  category: ItemCategory;
  condition: ItemCondition;
  images?: string[];
  location?: string;
  contact: string;
}

/**
 * 更新商品请求
 */
export interface UpdateMarketplaceItemRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: ItemCategory;
  condition?: ItemCondition;
  images?: string[];
  location?: string;
  contact?: string;
  status?: ItemStatus;
}

/**
 * 商品查询参数
 */
export interface MarketplaceQueryParams {
  page?: number;
  limit?: number;
  category?: ItemCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  status?: ItemStatus;
  sortBy?: 'createdAt' | 'price' | 'viewCount';
  order?: 'asc' | 'desc';
  q?: string;
}

