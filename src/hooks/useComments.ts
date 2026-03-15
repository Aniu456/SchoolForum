import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, postApi, likeApi } from '@/api';
import type { CreateCommentRequest } from '@/types';

// 获取帖子的评论列表 - 使用 postApi.getPostComments
export const useComments = (
  postId: string,
  options?: { page?: number; limit?: number; sortBy?: 'createdAt' | 'likeCount'; previewLimit?: number },
) => {
  const params = {
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
    sortBy: options?.sortBy ?? 'createdAt',
    previewLimit: options?.previewLimit ?? 3,
  };

  return useQuery({
    queryKey: ['comments', postId, params],
    queryFn: () => postApi.getPostComments(postId, params),
    enabled: !!postId,
    staleTime: 0, // 设置为0，确保总是获取最新数据
    refetchOnWindowFocus: true, // 窗口聚焦时重新获取
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.createComment(data),
    onSuccess: (response, variables) => {
      // 使用请求数据中的 postId，因为响应可能不包含
      const postId = (response as any)?.postId || variables.postId;
      
      if (postId) {
        // 使评论列表缓存失效并立即刷新
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        // 更新帖子评论数
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
      }
      // 刷新所有评论和帖子列表
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 点赞/取消点赞评论 - 使用 likeApi.toggleLike
export const useToggleLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      likeApi.toggleLike({ targetId: commentId, targetType: 'COMMENT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};

// 兼容旧代码：点赞评论
export const useLikeComment = () => {
  const toggleLike = useToggleLikeComment();
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate(id),
    mutateAsync: (id: string) => toggleLike.mutateAsync(id),
  };
};

// 兼容旧代码：取消点赞评论
export const useUnlikeComment = () => {
  const toggleLike = useToggleLikeComment();
  return {
    ...toggleLike,
    mutate: (id: string) => toggleLike.mutate(id),
    mutateAsync: (id: string) => toggleLike.mutateAsync(id),
  };
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentApi.deleteComment(id),
    onSuccess: (_data, _id) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

