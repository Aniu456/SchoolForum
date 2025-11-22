/**
 * 二手交易市场 API
 */
import { api } from '../core/client';
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
  return await api.get('/secondhand', { params });
};

/**
 * 获取商品详情
 */
export const getMarketplaceItem = async (id: string): Promise<MarketplaceItem> => {
  return await api.get(`/secondhand/${id}`);
};

/**
 * 创建商品
 */
export const createMarketplaceItem = async (data: CreateMarketplaceItemRequest): Promise<MarketplaceItem> => {
  return await api.post('/secondhand', data);
};

/**
 * 更新商品
 */
export const updateMarketplaceItem = async (id: string, data: UpdateMarketplaceItemRequest): Promise<MarketplaceItem> => {
  return await api.put(`/secondhand/${id}`, data);
};

/**
 * 删除商品
 */
export const deleteMarketplaceItem = async (id: string): Promise<void> => {
  await api.delete(`/secondhand/${id}`);
};

/**
 * 获取我的商品
 */
export const getMyMarketplaceItems = async (params?: MarketplaceQueryParams): Promise<PaginatedResponse<MarketplaceItem>> => {
  return await api.get('/secondhand/my', { params });
};

/**
 * 搜索商品
 */
export const searchMarketplaceItems = async (params: MarketplaceQueryParams): Promise<PaginatedResponse<MarketplaceItem>> => {
  return await api.get('/secondhand/search', { params });
};

/**
 * 收藏商品
 */
export const favoriteMarketplaceItem = async (id: string): Promise<void> => {
  await api.post(`/secondhand/${id}/favorite`);
};

/**
 * 取消收藏商品
 */
export const unfavoriteMarketplaceItem = async (id: string): Promise<void> => {
  await api.delete(`/secondhand/${id}/favorite`);
};

/**
 * 标记商品为已售出
 */
export const markAsSold = async (id: string): Promise<MarketplaceItem> => {
  return await api.post(`/secondhand/${id}/sold`);
};

/**
 * 标记商品为已预定
 */
export const markAsReserved = async (id: string): Promise<MarketplaceItem> => {
  return await api.post(`/secondhand/${id}/reserved`);
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
