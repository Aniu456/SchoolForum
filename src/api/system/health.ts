import { api } from '../core/client';

/**
 * 服务状态
 */
export interface ServiceStatus {
  database: 'healthy' | 'unhealthy';
  redis: 'healthy' | 'unhealthy';
}

/**
 * 健康检查响应
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: ServiceStatus;
  error?: string;
}

/**
 * 系统监控相关 API
 */
export const healthApi = {
  /**
   * 健康检查
   * GET /health
   */
  check: () => {
    return api.get<HealthResponse>('/health');
  },
};
