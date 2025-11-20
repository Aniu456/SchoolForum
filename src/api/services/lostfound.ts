/**
 * 失物招领 API
 */
import client from '../core/client';
import type {
  LostFoundItem,
  CreateLostFoundRequest,
  UpdateLostFoundRequest,
  LostFoundQueryParams,
  PaginatedResponse,
} from '@/types';

/**
 * 获取失物招领列表
 */
export const getLostFoundItems = async (params?: LostFoundQueryParams): Promise<PaginatedResponse<LostFoundItem>> => {
  const response = await client.get('/lostfound', { params });
  return response.data;
};

/**
 * 获取失物招领详情
 */
export const getLostFoundItem = async (id: string): Promise<LostFoundItem> => {
  const response = await client.get(`/lostfound/${id}`);
  return response.data;
};

/**
 * 创建失物招领
 */
export const createLostFoundItem = async (data: CreateLostFoundRequest): Promise<LostFoundItem> => {
  const response = await client.post('/lostfound', data);
  return response.data;
};

/**
 * 更新失物招领
 */
export const updateLostFoundItem = async (id: string, data: UpdateLostFoundRequest): Promise<LostFoundItem> => {
  const response = await client.put(`/lostfound/${id}`, data);
  return response.data;
};

/**
 * 删除失物招领
 */
export const deleteLostFoundItem = async (id: string): Promise<void> => {
  await client.delete(`/lostfound/${id}`);
};

/**
 * 获取我的失物招领
 */
export const getMyLostFoundItems = async (params?: LostFoundQueryParams): Promise<PaginatedResponse<LostFoundItem>> => {
  const response = await client.get('/lostfound/my', { params });
  return response.data;
};

/**
 * 搜索失物招领
 */
export const searchLostFoundItems = async (params: LostFoundQueryParams): Promise<PaginatedResponse<LostFoundItem>> => {
  const response = await client.get('/lostfound/search', { params });
  return response.data;
};

/**
 * 标记为已认领
 */
export const markAsClaimed = async (id: string): Promise<LostFoundItem> => {
  const response = await client.post(`/lostfound/${id}/claimed`);
  return response.data;
};

/**
 * 获取最新失物招领
 */
export const getLatestLostFoundItems = async (limit = 10): Promise<LostFoundItem[]> => {
  const response = await client.get('/lostfound/latest', { params: { limit } });
  return response.data;
};

export default {
  getLostFoundItems,
  getLostFoundItem,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  getMyLostFoundItems,
  searchLostFoundItems,
  markAsClaimed,
  getLatestLostFoundItems,
};

