import { api, PaginatedResponse } from '../core/client';

export interface Draft {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  images?: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftRequest {
  title?: string;
  content?: string;
  tags?: string[];
  images?: string[];
}

export const draftApi = {
  createOrUpdate: (data: CreateDraftRequest) =>
    api.post<Draft>('/posts/drafts', data),

  getList: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Draft>>('/posts/drafts', { params }),

  getDetail: (id: string) =>
    api.get<Draft>(`/posts/drafts/${id}`),

  publish: (id: string) =>
    api.post(`/posts/drafts/${id}/publish`),

  delete: (id: string) =>
    api.delete(`/posts/drafts/${id}`),
};
