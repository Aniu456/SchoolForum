import { api, PaginatedResponse } from '../core/client';
import type { Post } from '@/types';

/**
 * 服务中心分类
 */
export interface ServiceCategory {
  key: string;
  label: string;
  tag: string;
  description: string;
}

/**
 * 服务中心专用 API
 */
export const serviceCenterApi = {
  /**
   * 获取服务中心分类
   * GET /service-center/categories
   */
  getCategories: () => {
    return api.get<ServiceCategory[]>('/service-center/categories');
  },

  /**
   * 获取社团招新列表
   * GET /service-center/club-recruitment
   */
  getClubRecruitment: (page: number = 1, limit: number = 20) => {
    return api.get<PaginatedResponse<Post>>('/service-center/club-recruitment', {
      params: { page, limit },
    });
  },

  /**
   * 获取失物招领列表
   * GET /service-center/lost-and-found
   */
  getLostAndFound: (page: number = 1, limit: number = 20) => {
    return api.get<PaginatedResponse<Post>>('/service-center/lost-and-found', {
      params: { page, limit },
    });
  },

  /**
   * 获取拼车拼单列表
   * GET /service-center/carpool
   */
  getCarpool: (page: number = 1, limit: number = 20) => {
    return api.get<PaginatedResponse<Post>>('/service-center/carpool', {
      params: { page, limit },
    });
  },

  /**
   * 获取二手交易列表（帖子形式）
   * GET /service-center/secondhand
   */
  getSecondhand: (page: number = 1, limit: number = 20) => {
    return api.get<PaginatedResponse<Post>>('/service-center/secondhand', {
      params: { page, limit },
    });
  },

  /**
   * 获取学习资源列表（帖子形式）
   * GET /service-center/study-resource
   */
  getStudyResource: (page: number = 1, limit: number = 20) => {
    return api.get<PaginatedResponse<Post>>('/service-center/study-resource', {
      params: { page, limit },
    });
  },
};
