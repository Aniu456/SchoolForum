/**
 * 二手交易市场 API
 */
import client from '../core/client';
import type {
  MarketplaceItem,
  CreateMarketplaceItemRequest,
  UpdateMarketplaceItemRequest,
  MarketplaceQueryParams,
  PaginatedResponse,
} from '@/types';

/**
 * 获取商品列表
 */
export const getMarketplaceItems = async (params?: MarketplaceQueryParams): Promise<PaginatedResponse<MarketplaceItem>> => {
  const response = await client.get('/marketplace', { params });
  return response.data;
};

/**
 * 获取商品详情
 */
export const getMarketplaceItem = async (id: string): Promise<MarketplaceItem> => {
  const response = await client.get(`/marketplace/${id}`);
  return response.data;
};

/**
 * 创建商品
 */
export const createMarketplaceItem = async (data: CreateMarketplaceItemRequest): Promise<MarketplaceItem> => {
  const response = await client.post('/marketplace', data);
  return response.data;
};

/**
 * 更新商品
 */
export const updateMarketplaceItem = async (id: string, data: UpdateMarketplaceItemRequest): Promise<MarketplaceItem> => {
  const response = await client.put(`/marketplace/${id}`, data);
  return response.data;
};

/**
 * 删除商品
 */
export const deleteMarketplaceItem = async (id: string): Promise<void> => {
  await client.delete(`/marketplace/${id}`);
};

/**
 * 获取我的商品
 */
export const getMyMarketplaceItems = async (params?: MarketplaceQueryParams): Promise<PaginatedResponse<MarketplaceItem>> => {
  const response = await client.get('/marketplace/my', { params });
  return response.data;
};

/**
 * 搜索商品
 */
export const searchMarketplaceItems = async (params: MarketplaceQueryParams): Promise<PaginatedResponse<MarketplaceItem>> => {
  const response = await client.get('/marketplace/search', { params });
  return response.data;
};

/**
 * 收藏商品
 */
export const favoriteMarketplaceItem = async (id: string): Promise<void> => {
  await client.post(`/marketplace/${id}/favorite`);
};

/**
 * 取消收藏商品
 */
export const unfavoriteMarketplaceItem = async (id: string): Promise<void> => {
  await client.delete(`/marketplace/${id}/favorite`);
};

/**
 * 标记商品为已售出
 */
export const markAsSold = async (id: string): Promise<MarketplaceItem> => {
  const response = await client.post(`/marketplace/${id}/sold`);
  return response.data;
};

/**
 * 标记商品为已预定
 */
export const markAsReserved = async (id: string): Promise<MarketplaceItem> => {
  const response = await client.post(`/marketplace/${id}/reserved`);
  return response.data;
};

export default {
  getMarketplaceItems,
  getMarketplaceItem,
  createMarketplaceItem,
  updateMarketplaceItem,
  deleteMarketplaceItem,
  getMyMarketplaceItems,
  searchMarketplaceItems,
  favoriteMarketplaceItem,
  unfavoriteMarketplaceItem,
  markAsSold,
  markAsReserved,
};

