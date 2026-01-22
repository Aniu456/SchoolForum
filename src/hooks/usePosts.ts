import { likeApi, postApi, recommendationApi, searchApi } from "@/api"
import type { CreatePostRequest, Post, PostQueryParams, UpdatePostRequest } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type UsePostsOptions = {
  enabled?: boolean
}

// API响应类型定义
interface PostListResponse {
  data: Post[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface SearchPostsParams {
  q: string
  page?: number
  limit?: number
  sortBy?: "createdAt" | "viewCount" | "relevance"
  category?: string
}

// 获取帖子列表
export const usePosts = (params?: PostQueryParams, options?: UsePostsOptions) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      // 转换参数类型以匹配API期望
      const apiParams = {
        page: params?.page,
        limit: params?.limit,
        sortBy: (params?.sortBy as "createdAt" | "viewCount") || "createdAt",
        order: (params?.order as "asc" | "desc") || "desc",
        tag: params?.tag,
        authorId: params?.authorId,
        keyword: params?.keyword,
      }
      const response = await postApi.getPosts(apiParams)
      return response as PostListResponse
    },
    staleTime: 1000 * 60 * 5, // 5分钟内数据视为新鲜
    enabled: options?.enabled ?? true,
  })
}

// 获取单个帖子
export const usePost = (id: string) => {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => postApi.getPost(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// 创建帖子
export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postApi.createPost(data),
    onSuccess: () => {
      // 使帖子列表缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })
}

// 更新帖子
export const useUpdatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePostRequest }) => postApi.updatePost(id, updates),
    onSuccess: (data, variables) => {
      // 更新单个帖子缓存
      queryClient.setQueryData(["post", variables.id], data)
      // 使帖子列表缓存失效
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })
}

// 删除帖子
export const useDeletePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => postApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })
}

// 点赞/取消点赞帖子 (使用 toggle API)
export const useToggleLikePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: "POST" | "COMMENT" }) =>
      likeApi.toggleLike({ targetId, targetType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post"] })
    },
  })
}

// 兼容旧代码：点赞帖子
export const useLikePost = () => {
  const toggleLike = useToggleLikePost()
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate({ targetId: id, targetType: "POST" }),
    mutateAsync: (id: string) => toggleLike.mutateAsync({ targetId: id, targetType: "POST" }),
  }
}

// 兼容旧代码：取消点赞
export const useUnlikePost = () => {
  const toggleLike = useToggleLikePost()
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate({ targetId: id, targetType: "POST" }),
    mutateAsync: (id: string) => toggleLike.mutateAsync({ targetId: id, targetType: "POST" }),
  }
}

// 收藏帖子 - 使用 favoriteApi
// Note: This requires a folderId, so it's not a direct replacement
export const useCollectPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId: _postId, folderId: _folderId }: { postId: string; folderId: string }) => {
      throw new Error("Use favoriteApi.addFavorite with folderId instead")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })
}

// 取消收藏 - 使用 favoriteApi
export const useUncollectPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (_favoriteId: string) => {
      throw new Error("Use favoriteApi.removeFavorite with favoriteId instead")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })
}

// 搜索帖子 - 使用 searchApi
export const useSearchPosts = (keyword: string, params?: PostQueryParams) => {
  return useQuery({
    queryKey: ["posts", "search", keyword, params],
    queryFn: async () => {
      const searchParams: SearchPostsParams = {
        q: keyword,
        page: params?.page,
        limit: params?.limit,
        sortBy: (params?.sortBy as "createdAt" | "viewCount" | "relevance") || "createdAt",
        category: params?.tag,
      }
      return searchApi.searchPosts(searchParams)
    },
    enabled: !!keyword,
    staleTime: 1000 * 60 * 2,
  })
}

// 获取热门帖子 - 使用 recommendationApi
export const useHotPosts = (limit = 10) => {
  return useQuery({
    queryKey: ["posts", "hot", limit],
    queryFn: () => recommendationApi.getHotPosts(limit),
    staleTime: 1000 * 60 * 10, // 10分钟
  })
}

// 获取相关帖子 - 不存在于 USER_API
export const useRelatedPosts = (postId: string, limit = 5) => {
  return useQuery({
    queryKey: ["posts", "related", postId, limit],
    queryFn: () => {
      throw new Error("getRelatedPosts is not available in USER_API")
    },
    enabled: false,
    staleTime: 1000 * 60 * 10,
  })
}
