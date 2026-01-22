import type { Comment, Post } from "@/types"
import { PaginatedResponse, api } from "../core/client"

/**
 * 创建帖子请求
 */
export interface CreatePostDto {
  title: string // 必填，5-200 字符
  content: string // 必填，10-50000 字符
  images?: string[] // 可选，URL 数组，最多 9 个
  tags?: string[] // 可选，字符串数组，最多 10 个
}

/**
 * 更新帖子请求
 */
export interface UpdatePostDto {
  title?: string
  content?: string
  images?: string[]
  tags?: string[]
}

/**
 * 帖子查询参数
 */
export interface PostQueryParams {
  page?: number // 默认 1
  limit?: number // 默认 20
  sortBy?: "createdAt" | "viewCount" // 默认 createdAt
  order?: "asc" | "desc" // 默认 desc
  tag?: string // 按标签过滤
  authorId?: string // 按作者过滤
}

/**
 * 评论查询参数
 */
export interface CommentQueryParams {
  page?: number // 默认 1
  limit?: number // 默认 20
  sortBy?: "createdAt" | "likeCount" // 默认 createdAt
  previewLimit?: number
}

/**
 * 帖子相关 API（模块：Posts）
 */
export const postApi = {
  /**
   * 创建帖子
   * POST /posts
   */
  createPost: (data: CreatePostDto) => {
    return api.post<Post>("/posts", data)
  },

  /**
   * 获取帖子列表（公开）
   * GET /posts
   */
  getPosts: (params?: PostQueryParams) => {
    return api.get<PaginatedResponse<Post>>("/posts", { params })
  },

  /**
   * 获取帖子详情（公开）
   * GET /posts/:id
   */
  getPost: (postId: string) => {
    return api.get<Post>(`/posts/${postId}`)
  },

  /**
   * 获取帖子评论列表（公开，带嵌套回复）
   * GET /posts/:id/comments
   */
  getPostComments: (postId: string, params?: CommentQueryParams) => {
    return api.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, { params })
  },

  /**
   * 更新帖子
   * PATCH /posts/:id
   */
  updatePost: (postId: string, data: UpdatePostDto) => {
    return api.patch<Post>(`/posts/${postId}`, data)
  },

  /**
   * 删除帖子
   * DELETE /posts/:id
   */
  deletePost: (postId: string) => {
    return api.delete<{ message: string }>(`/posts/${postId}`)
  },
}
