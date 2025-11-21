import { useInfiniteQuery } from '@tanstack/react-query';
import { postApi, recommendationApi } from '@/api';
import type { PostQueryParams, SortType } from '@/types';

interface UseInfinitePostsParams extends Omit<PostQueryParams, 'page' | 'sortBy'> {
  limit?: number;
  sortBy?: SortType;
}

// 将前端 sortBy 值映射到后端期望的值
const mapSortByToBackend = (sortBy?: SortType): 'createdAt' | 'viewCount' => {
  switch (sortBy) {
    case 'popular':
    case 'most_commented':
      return 'viewCount';
    case 'latest':
    default:
      return 'createdAt';
  }
};

export const useInfinitePosts = (params?: UseInfinitePostsParams) => {
  const limit = params?.limit || 10;
  const backendSortBy = mapSortByToBackend(params?.sortBy);

  return useInfiniteQuery({
    // 使用具体的值而不是对象引用，确保 queryKey 稳定
    queryKey: ['posts', 'infinite', params?.sortBy, params?.tag, params?.authorId, params?.keyword, params?.q, limit],
    queryFn: ({ pageParam = 1 }) => {
      const page = Number(pageParam) || 1;
      // 按 API 文档使用推荐接口的趋势/热门/最新定义
      if (params?.sortBy === 'trending') {
        return recommendationApi.getTrendingPosts(page, limit);
      }

      if (params?.sortBy === 'popular') {
        return recommendationApi.getHotPosts(page, limit);
      }

      // 无过滤条件时优先直接调用推荐接口的最新列表
      const hasFilters = params?.tag || params?.authorId || params?.keyword || params?.q;
      if (!hasFilters && (!params?.sortBy || params?.sortBy === 'latest')) {
        return recommendationApi.getLatestPosts(page, limit);
      }

      return postApi.getPosts({
        ...params,
        page,
        limit: limit,
        sortBy: backendSortBy,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) {
        return undefined;
      }

      const wrapper: any = lastPage as any;

      // 兼容后端返回：
      // 1) { data: Post[], meta: {...} }
      // 2) { success: true, data: { data: Post[], meta: {...} }, timestamp: ... }
      // 3) { data: Post[], pagination: {...} }
      const paginated =
        wrapper?.data && Array.isArray(wrapper.data.data)
          ? wrapper.data
          : wrapper?.data && Array.isArray(wrapper.data)
            ? wrapper
            : wrapper;

      const posts: any[] | undefined = paginated?.data;
      const meta = paginated?.meta || paginated?.pagination;

      if (meta) {
        const currentPage = meta.page ?? allPages.length;
        const totalPages = meta.totalPages;

        if (typeof totalPages === 'number') {
          return currentPage < totalPages ? currentPage + 1 : undefined;
        }
      }

      if (!posts || posts.length < limit) {
        return undefined;
      }

      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10, // 10分钟后清除缓存
    refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
  });
};
