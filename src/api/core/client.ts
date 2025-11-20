import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// 从环境变量读取 API 地址，如果没有则使用默认值
const BASE_URL = import.meta.env.VITE_API_BASE_URL
const TIMEOUT = 10000;

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许跨域请求携带 cookies
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 accessToken
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 如果是开发环境，打印请求信息
    if (import.meta.env.DEV) {
      console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是开发环境，打印响应信息
    if (import.meta.env.DEV) {
      console.log('[API Response]', response.status, response.config.url, response.data);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 处理 401，尝试使用 refreshToken 刷新访问令牌
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken },
            {
              withCredentials: true,
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data as {
            accessToken: string;
            refreshToken: string;
          };

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // 同步更新 Zustand 中的 token
          const authState = useAuthStore.getState();
          authState.setAuth({
            user: authState.user,
            accessToken,
            refreshToken: newRefreshToken,
          });

          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // 没有 refreshToken，直接跳转登录
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 已尝试刷新失败，清除 token 并跳转到登录页
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          break;
        case 403:
          console.error('[API Error] 403: 没有权限访问该资源');
          break;
        case 404:
          console.warn('[API Warning] 404: 请求的资源不存在');
          break;
        case 500:
          console.error('[API Error] 500: 服务器内部错误');
          break;
        default:
          console.error(`[API Error] ${status}:`, data);
      }
    } else if (error.request) {
      console.error('[API Error] 网络错误或服务器无响应', error.request);
    } else {
      console.error('[API Error]', error.message);
    }

    return Promise.reject(error);
  }
);

// 分页元数据类型（API.md 标准格式）
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number; // 用于通知列表
}

// 分页响应类型（API.md 标准格式）
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// 部分接口使用的分页格式
export interface AlternatePaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 封装的请求方法
class ApiClient {
  // GET 请求 - 直接返回响应数据
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<any>(url, config);
    // 兼容后端返回 {success: true, data: ...} 格式
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data;
  }

  // POST 请求 - 直接返回响应数据
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<any>(url, data, config);
    // 兼容后端返回 {success: true, data: ...} 格式
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data;
  }

  // PUT 请求 - 直接返回响应数据
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<any>(url, data, config);
    // 兼容后端返回 {success: true, data: ...} 格式
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data;
  }

  // PATCH 请求 - 直接返回响应数据
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<any>(url, data, config);
    // 兼容后端返回 {success: true, data: ...} 格式
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data;
  }

  // DELETE 请求 - 直接返回响应数据
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<any>(url, config);
    // 兼容后端返回 {success: true, data: ...} 格式
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data;
  }

  // 上传文件
  async upload<T = any>(url: string, file: File, onUploadProgress?: (progressEvent: any) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // 下载文件
  async download(url: string, filename: string): Promise<void> {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}

// 导出单例实例
export const api = new ApiClient();

// 同时导出 axios 实例，以便需要更灵活的使用
export default apiClient;
