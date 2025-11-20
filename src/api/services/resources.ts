/**
 * 学习资源分享 API
 */
import client from '../core/client';
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceQueryParams,
  PaginatedResponse,
} from '@/types';

/**
 * 获取资源列表
 */
export const getResources = async (params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> => {
  const response = await client.get('/resources', { params });
  return response.data;
};

/**
 * 获取资源详情
 */
export const getResource = async (id: string): Promise<Resource> => {
  const response = await client.get(`/resources/${id}`);
  return response.data;
};

/**
 * 创建资源
 */
export const createResource = async (data: CreateResourceRequest): Promise<Resource> => {
  const response = await client.post('/resources', data);
  return response.data;
};

/**
 * 更新资源
 */
export const updateResource = async (id: string, data: UpdateResourceRequest): Promise<Resource> => {
  const response = await client.put(`/resources/${id}`, data);
  return response.data;
};

/**
 * 删除资源
 */
export const deleteResource = async (id: string): Promise<void> => {
  await client.delete(`/resources/${id}`);
};

/**
 * 获取我的资源
 */
export const getMyResources = async (params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> => {
  const response = await client.get('/resources/my', { params });
  return response.data;
};

/**
 * 搜索资源
 */
export const searchResources = async (params: ResourceQueryParams): Promise<PaginatedResponse<Resource>> => {
  const response = await client.get('/resources/search', { params });
  return response.data;
};

/**
 * 下载资源
 */
export const downloadResource = async (id: string): Promise<void> => {
  await client.post(`/resources/${id}/download`);
};

/**
 * 点赞资源（使用统一的点赞 API）
 */
export const likeResource = async (id: string): Promise<void> => {
  await client.post('/likes/toggle', { targetId: id, targetType: 'RESOURCE' });
};

/**
 * 获取热门资源
 */
export const getHotResources = async (limit = 10): Promise<Resource[]> => {
  const response = await client.get('/resources/hot', { params: { limit } });
  return response.data;
};

/**
 * 获取最新资源
 */
export const getLatestResources = async (limit = 10): Promise<Resource[]> => {
  const response = await client.get('/resources/latest', { params: { limit } });
  return response.data;
};

export default {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getMyResources,
  searchResources,
  downloadResource,
  likeResource,
  getHotResources,
  getLatestResources,
};

