/**
 * 学习资源 Hooks
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { resourcesApi } from '@/api';
import type { Resource, ResourceQueryParams } from '@/types/resources';
import { CACHE_CONFIG } from '@/config';

/**
 * 获取资源列表
 */
export function useResources(params?: ResourceQueryParams) {
  return useQuery({
    queryKey: ['resources', 'list', params],
    queryFn: () => resourcesApi.getResources(params),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

/**
 * 无限滚动加载资源
 */
export function useInfiniteResources(params?: Omit<ResourceQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['resources', 'list', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => resourcesApi.getResources({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

/**
 * 获取资源详情
 */
export function useResource(resourceId: string) {
  return useQuery({
    queryKey: ['resources', 'detail', resourceId],
    queryFn: () => resourcesApi.getResource(resourceId),
    enabled: !!resourceId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

/**
 * 创建资源
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resourcesApi.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'my'] });
    },
  });
}

/**
 * 更新资源
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceId, data }: { resourceId: string; data: Partial<Resource> }) =>
      resourcesApi.updateResource(resourceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'detail', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'my'] });
    },
  });
}

/**
 * 删除资源
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resourcesApi.deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'my'] });
    },
  });
}

/**
 * 获取我的资源
 */
export function useMyResources(params?: ResourceQueryParams) {
  return useQuery({
    queryKey: ['resources', 'my', params],
    queryFn: () => resourcesApi.getMyResources(params),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

/**
 * 下载资源
 */
export function useDownloadResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resourcesApi.downloadResource,
    onSuccess: (_, resourceId) => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'detail', resourceId] });
    },
  });
}

/**
 * 点赞资源
 */
export function useLikeResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resourcesApi.likeResource,
    onSuccess: (_, resourceId) => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'detail', resourceId] });
    },
  });
}

/**
 * 获取热门资源
 */
export function useHotResources(limit = 10) {
  return useQuery({
    queryKey: ['resources', 'hot', limit],
    queryFn: () => resourcesApi.getHotResources(limit),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

/**
 * 获取最新资源
 */
export function useLatestResources(limit = 10) {
  return useQuery({
    queryKey: ['resources', 'latest', limit],
    queryFn: () => resourcesApi.getLatestResources(limit),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

