import { api, PaginatedResponse } from '../core/client';

export type ResourceType = 'DOCUMENT' | 'VIDEO' | 'LINK' | 'CODE' | 'OTHER';

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ResourceType;
  fileUrl?: string;
  link?: string;
  tags?: string[];
  uploaderId: string;
  uploader: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  category: string;
  type: ResourceType;
  fileUrl?: string;
  link?: string;
  tags?: string[];
}

export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  type?: ResourceType;
}

export const studyResourceApi = {
  create: (data: CreateResourceRequest) =>
    api.post<StudyResource>('/study-resources', data),

  getList: (params?: ResourceQueryParams) =>
    api.get<PaginatedResponse<StudyResource>>('/study-resources', { params }),

  getDetail: (id: string) =>
    api.get<StudyResource>(`/study-resources/${id}`),

  update: (id: string, data: Partial<CreateResourceRequest>) =>
    api.patch<StudyResource>(`/study-resources/${id}`, data),

  delete: (id: string) =>
    api.delete(`/study-resources/${id}`),

  download: (id: string) =>
    api.post<StudyResource>(`/study-resources/${id}/download`),
};
