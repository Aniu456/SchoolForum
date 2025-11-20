/**
 * 拼车拼单 API
 */
import client from '../core/client';
import type {
  CarpoolItem,
  CreateCarpoolRequest,
  UpdateCarpoolRequest,
  CarpoolQueryParams,
  JoinCarpoolRequest,
  PaginatedResponse,
} from '@/types';

/**
 * 获取拼车拼单列表
 */
export const getCarpoolItems = async (params?: CarpoolQueryParams): Promise<PaginatedResponse<CarpoolItem>> => {
  const response = await client.get('/carpool', { params });
  return response.data;
};

/**
 * 获取拼车拼单详情
 */
export const getCarpoolItem = async (id: string): Promise<CarpoolItem> => {
  const response = await client.get(`/carpool/${id}`);
  return response.data;
};

/**
 * 创建拼车拼单
 */
export const createCarpoolItem = async (data: CreateCarpoolRequest): Promise<CarpoolItem> => {
  const response = await client.post('/carpool', data);
  return response.data;
};

/**
 * 更新拼车拼单
 */
export const updateCarpoolItem = async (id: string, data: UpdateCarpoolRequest): Promise<CarpoolItem> => {
  const response = await client.put(`/carpool/${id}`, data);
  return response.data;
};

/**
 * 删除拼车拼单
 */
export const deleteCarpoolItem = async (id: string): Promise<void> => {
  await client.delete(`/carpool/${id}`);
};

/**
 * 获取我的拼车拼单
 */
export const getMyCarpoolItems = async (params?: CarpoolQueryParams): Promise<PaginatedResponse<CarpoolItem>> => {
  const response = await client.get('/carpool/my', { params });
  return response.data;
};

/**
 * 搜索拼车拼单
 */
export const searchCarpoolItems = async (params: CarpoolQueryParams): Promise<PaginatedResponse<CarpoolItem>> => {
  const response = await client.get('/carpool/search', { params });
  return response.data;
};

/**
 * 加入拼车拼单
 */
export const joinCarpool = async (id: string, data?: { message?: string }): Promise<void> => {
  await client.post(`/carpool/${id}/join`, data);
};

/**
 * 退出拼车拼单
 */
export const leaveCarpool = async (id: string): Promise<void> => {
  await client.post(`/carpool/${id}/leave`);
};

/**
 * 完成拼车拼单
 */
export const completeCarpool = async (id: string): Promise<CarpoolItem> => {
  const response = await client.post(`/carpool/${id}/complete`);
  return response.data;
};

/**
 * 获取最新拼车拼单
 */
export const getLatestCarpoolItems = async (limit = 10): Promise<CarpoolItem[]> => {
  const response = await client.get('/carpool/latest', { params: { limit } });
  return response.data;
};

export default {
  getCarpoolItems,
  getCarpoolItem,
  createCarpoolItem,
  updateCarpoolItem,
  deleteCarpoolItem,
  getMyCarpoolItems,
  searchCarpoolItems,
  joinCarpool,
  leaveCarpool,
  completeCarpool,
  getLatestCarpoolItems,
};

