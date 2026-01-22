/**
 * 草稿数据类型
 */
export interface PostDraft {
  id: string
  title: string | null
  content: string | null
  images: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 创建/更新草稿DTO
 */
export interface CreatePostDraftDto {
  title?: string
  content?: string
  images?: string[]
  tags?: string[]
}

/**
 * 更新草稿DTO
 */
export interface UpdatePostDraftDto {
  title?: string
  content?: string
  images?: string[]
  tags?: string[]
}

/**
 * 草稿列表响应
 */
export interface DraftsListResponse {
  data: PostDraft[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

import { api } from "../core/client"

/**
 * 草稿API
 */
export const draftApi = {
  /**
   * 创建或更新草稿（自动保存）
   */
  createOrUpdateDraft: async (data: CreatePostDraftDto): Promise<PostDraft> => {
    return await api.post<PostDraft>("/posts/drafts", data)
  },

  /**
   * 获取草稿列表
   */
  getDrafts: async (page = 1, limit = 20): Promise<DraftsListResponse> => {
    return await api.get<DraftsListResponse>("/posts/drafts", {
      params: { page, limit },
    })
  },

  /**
   * 获取单个草稿详情
   */
  getDraft: async (id: string): Promise<PostDraft> => {
    return await api.get<PostDraft>(`/posts/drafts/${id}`)
  },

  /**
   * 更新草稿
   */
  updateDraft: async (id: string, data: UpdatePostDraftDto): Promise<PostDraft> => {
    return await api.patch<PostDraft>(`/posts/drafts/${id}`, data)
  },

  /**
   * 删除草稿
   */
  deleteDraft: async (id: string): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/posts/drafts/${id}`)
  },

  /**
   * 从草稿发布帖子
   */
  publishDraft: async (id: string): Promise<{ message: string; postId: string }> => {
    return await api.post<{ message: string; postId: string }>(`/posts/drafts/${id}/publish`)
  },
}

export default draftApi
