/**
 * 社团招新 API
 */
import client from '../core/client';
import type {
  Club,
  ClubRecruitment,
  CreateRecruitmentRequest,
  UpdateRecruitmentRequest,
  RecruitmentQueryParams,
  PaginatedResponse,
} from '@/types';

/**
 * 获取社团列表
 */
export const getClubs = async (params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Club>> => {
  const response = await client.get('/clubs', { params });
  return response.data;
};

/**
 * 获取社团详情
 */
export const getClub = async (id: string): Promise<Club> => {
  const response = await client.get(`/clubs/${id}`);
  return response.data;
};

/**
 * 获取招新列表
 */
export const getRecruitments = async (params?: RecruitmentQueryParams): Promise<PaginatedResponse<ClubRecruitment>> => {
  const response = await client.get('/clubs/recruitments', { params });
  return response.data;
};

/**
 * 获取招新详情
 */
export const getRecruitment = async (id: string): Promise<ClubRecruitment> => {
  const response = await client.get(`/clubs/recruitments/${id}`);
  return response.data;
};

/**
 * 创建招新
 */
export const createRecruitment = async (data: CreateRecruitmentRequest): Promise<ClubRecruitment> => {
  const response = await client.post('/clubs/recruitments', data);
  return response.data;
};

/**
 * 更新招新
 */
export const updateRecruitment = async (id: string, data: UpdateRecruitmentRequest): Promise<ClubRecruitment> => {
  const response = await client.put(`/clubs/recruitments/${id}`, data);
  return response.data;
};

/**
 * 删除招新
 */
export const deleteRecruitment = async (id: string): Promise<void> => {
  await client.delete(`/clubs/recruitments/${id}`);
};

/**
 * 获取我的招新
 */
export const getMyRecruitments = async (params?: RecruitmentQueryParams): Promise<PaginatedResponse<ClubRecruitment>> => {
  const response = await client.get('/clubs/recruitments/my', { params });
  return response.data;
};

/**
 * 搜索招新
 */
export const searchRecruitments = async (params: RecruitmentQueryParams): Promise<PaginatedResponse<ClubRecruitment>> => {
  const response = await client.get('/clubs/recruitments/search', { params });
  return response.data;
};

/**
 * 申请加入社团
 */
export const applyToClub = async (recruitmentId: string, message?: string): Promise<void> => {
  await client.post(`/clubs/recruitments/${recruitmentId}/apply`, { message });
};

/**
 * 获取热门招新
 */
export const getHotRecruitments = async (limit = 10): Promise<ClubRecruitment[]> => {
  const response = await client.get('/clubs/recruitments/hot', { params: { limit } });
  return response.data;
};

export default {
  getClubs,
  getClub,
  getRecruitments,
  getRecruitment,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  getMyRecruitments,
  searchRecruitments,
  applyToClub,
  getHotRecruitments,
};

