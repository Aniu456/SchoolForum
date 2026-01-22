import { api } from "../core/client"

/**
 * 学习资源数据类型
 */
export interface StudyResource {
  id: string
  title: string
  description: string
  category: string
  type: "note" | "exam" | "material" | "other"
  fileUrl: string
  fileName: string
  fileSize?: number
  thumbnail?: string
  downloadCount: number
  authorId: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  tags: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 创建学习资源DTO
 */
export interface CreateStudyResourceDto {
  title: string
  description: string
  category: string
  type: "note" | "exam" | "material" | "other"
  fileUrl: string
  fileName: string
  fileSize?: number
  thumbnail?: string
  tags?: string[]
}

/**
 * 更新学习资源DTO
 */
export interface UpdateStudyResourceDto {
  title?: string
  description?: string
  category?: string
  type?: "note" | "exam" | "material" | "other"
  fileUrl?: string
  fileName?: string
  fileSize?: number
  thumbnail?: string
  tags?: string[]
}

/**
 * 学习资源列表响应
 */
export interface StudyResourceListResponse {
  data: StudyResource[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 学习资源API
 */
export const studyResourcesApi = {
  /**
   * 创建学习资源
   */
  create: async (data: CreateStudyResourceDto): Promise<StudyResource> => {
    return await api.post<StudyResource>("/study-resources", data)
  },

  /**
   * 获取学习资源列表
   */
  findAll: async (
    page = 1,
    limit = 20,
    category?: string,
    type?: string
  ): Promise<StudyResourceListResponse> => {
    return await api.get<StudyResourceListResponse>("/study-resources", {
      params: { page, limit, category, type },
    })
  },

  /**
   * 获取单个学习资源
   */
  findOne: async (id: string): Promise<StudyResource> => {
    return await api.get<StudyResource>(`/study-resources/${id}`)
  },

  /**
   * 下载学习资源（增加下载计数）
   */
  download: async (id: string): Promise<{ message: string; downloadCount: number }> => {
    return await api.post<{ message: string; downloadCount: number }>(
      `/study-resources/${id}/download`
    )
  },

  /**
   * 更新学习资源
   */
  update: async (id: string, data: UpdateStudyResourceDto): Promise<StudyResource> => {
    return await api.patch<StudyResource>(`/study-resources/${id}`, data)
  },

  /**
   * 删除学习资源
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/study-resources/${id}`)
  },
}
