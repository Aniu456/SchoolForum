import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi, likeApi, searchApi, recommendationApi } from '@/api';
import type { Post, CreatePostRequest, UpdatePostRequest, PostQueryParams } from '@/types';

type UsePostsOptions = {
  enabled?: boolean;
};

// 获取帖子列表
export const usePosts = (params?: PostQueryParams, options?: UsePostsOptions) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postApi.getPosts(params as any), // Type cast to avoid conflict between API and types
    staleTime: 1000 * 60 * 5, // 5分钟内数据视为新鲜
    enabled: options?.enabled ?? true,
  });
};

// 获取单个帖子
export const usePost = (id: string) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postApi.getPost(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// 创建帖子
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postApi.createPost(data),
    onSuccess: () => {
      // 使帖子列表缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 更新帖子
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePostRequest }) =>
      postApi.updatePost(id, updates),
    onSuccess: (data, variables) => {
      // 更新单个帖子缓存
      queryClient.setQueryData(['post', variables.id], data);
      // 使帖子列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 删除帖子
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 点赞/取消点赞帖子 (使用 toggle API)
export const useToggleLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: 'POST' | 'COMMENT' }) =>
      likeApi.toggleLike({ targetId, targetType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
};

// 兼容旧代码：点赞帖子
export const useLikePost = () => {
  const toggleLike = useToggleLikePost();
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate({ targetId: id, targetType: 'POST' }),
    mutateAsync: (id: string) => toggleLike.mutateAsync({ targetId: id, targetType: 'POST' }),
  };
};

// 兼容旧代码：取消点赞
export const useUnlikePost = () => {
  const toggleLike = useToggleLikePost();
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate({ targetId: id, targetType: 'POST' }),
    mutateAsync: (id: string) => toggleLike.mutateAsync({ targetId: id, targetType: 'POST' }),
  };
};

// 收藏帖子 - 使用 favoriteApi
// Note: This requires a folderId, so it's not a direct replacement
export const useCollectPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, folderId }: { postId: string; folderId: string }) => {
      throw new Error('Use favoriteApi.addFavorite with folderId instead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 取消收藏 - 使用 favoriteApi
export const useUncollectPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteId: string) => {
      throw new Error('Use favoriteApi.removeFavorite with favoriteId instead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 搜索帖子 - 使用 searchApi
export const useSearchPosts = (keyword: string, params?: PostQueryParams) => {
  return useQuery({
    queryKey: ['posts', 'search', keyword, params],
    queryFn: () => searchApi.searchPosts({ q: keyword, ...params } as any),
    enabled: !!keyword,
    staleTime: 1000 * 60 * 2,
  });
};

// 获取热门帖子 - 使用 recommendationApi
export const useHotPosts = (limit = 10) => {
  return useQuery({
    queryKey: ['posts', 'hot', limit],
    queryFn: () => recommendationApi.getHotPosts(limit),
    staleTime: 1000 * 60 * 10, // 10分钟
  });
};

// 获取相关帖子 - 不存在于 USER_API
export const useRelatedPosts = (postId: string, limit = 5) => {
  return useQuery({
    queryKey: ['posts', 'related', postId, limit],
    queryFn: () => {
      throw new Error('getRelatedPosts is not available in USER_API');
    },
    enabled: false,
    staleTime: 1000 * 60 * 10,
  });
};
