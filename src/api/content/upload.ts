import apiClient from '../core/client';

export interface UploadResponse {
  filename: string;
  url: string;
}

export interface MultiUploadResponse {
  filenames: string[];
  urls: string[];
}

export interface DocumentUploadResponse {
  filename: string;
  originalName: string;
  url: string;
}

export const uploadApi = {
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ data: UploadResponse }>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ data: UploadResponse }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  uploadImages: async (files: File[]): Promise<MultiUploadResponse> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await apiClient.post<{ data: MultiUploadResponse }>('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  uploadDocument: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ data: DocumentUploadResponse }>('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
