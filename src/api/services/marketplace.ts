import { api } from "../core/client"

/**
 * 二手商品类型
 */
export interface SecondhandItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  condition: "new" | "like_new" | "good" | "fair"
  location?: string
  status: "available" | "sold" | "reserved"
  contactInfo: string
  authorId: string
  author?: {
    id: string
    username: string
    nickname: string
    avatar: string
  }
  createdAt: string
  updatedAt: string
  viewCount?: number
}

/**
 * 创建二手商品DTO
 */
export interface CreateSecondhandDto {
  title: string
  description: string
  price: number
  category: string
  images?: string[]
  condition?: "new" | "like_new" | "good" | "fair"
  location?: string
  contactInfo: string
}

/**
 * 更新二手商品DTO
 */
export interface UpdateSecondhandDto {
  title?: string
  description?: string
  price?: number
  category?: string
  images?: string[]
  condition?: "new" | "like_new" | "good" | "fair"
  location?: string
  contactInfo?: string
  status?: "available" | "sold" | "reserved"
}

/**
 * 列表响应
 */
export interface SecondhandListResponse {
  data: SecondhandItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 二手市场API
 */
export const secondhandApi = {
  /**
   * 创建商品
   */
  create: async (data: CreateSecondhandDto): Promise<SecondhandItem> => {
    return await api.post<SecondhandItem>("/secondhand", data)
  },

  /**
   * 获取商品列表
   */
  findAll: async (
    page = 1,
    limit = 20,
    category?: string,
    status?: string
  ): Promise<SecondhandListResponse> => {
    return await api.get<SecondhandListResponse>("/secondhand", {
      params: { page, limit, category, status },
    })
  },

  /**
   * 获取商品详情
   */
  findOne: async (id: string): Promise<SecondhandItem> => {
    return await api.get<SecondhandItem>(`/secondhand/${id}`)
  },

  /**
   * 更新商品
   */
  update: async (
    id: string,
    data: UpdateSecondhandDto
  ): Promise<SecondhandItem> => {
    return await api.patch<SecondhandItem>(`/secondhand/${id}`, data)
  },

  /**
   * 删除商品
   */
  remove: async (id: string): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/secondhand/${id}`)
  },

  /**
   * 别名方法，保持一致性
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/secondhand/${id}`)
  },
}

export default secondhandApi
