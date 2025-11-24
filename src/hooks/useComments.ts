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
    staleTime: 1000 * 60 * 2, // 2分钟内数据视为新鲜
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.createComment(data),
    onSuccess: (data) => {
      // 使评论列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['comments', data.postId] });
      // 更新帖子评论数
      queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
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

