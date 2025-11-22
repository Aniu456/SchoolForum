/**
 * 二手交易 Hooks
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/api';
import type { MarketplaceItem, MarketplaceQueryParams } from '@/types/marketplace';
import { CACHE_CONFIG } from '@/config';

/**
 * 获取商品列表
 */
export function useMarketplaceItems(params?: MarketplaceQueryParams) {
  return useQuery({
    queryKey: ['marketplace', 'items', params],
    queryFn: () => marketplaceApi.getMarketplaceItems(params),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

/**
 * 无限滚动加载商品
 */
export function useInfiniteMarketplaceItems(params?: Omit<MarketplaceQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['marketplace', 'items', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => marketplaceApi.getMarketplaceItems({ ...params, page: pageParam }),
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
 * 获取商品详情
 */
export function useMarketplaceItem(itemId: string) {
  return useQuery({
    queryKey: ['marketplace', 'item', itemId],
    queryFn: () => marketplaceApi.getMarketplaceItem(itemId),
    enabled: !!itemId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

/**
 * 创建商品
 */
export function useCreateMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketplaceApi.createMarketplaceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my'] });
    },
  });
}

/**
 * 更新商品
 */
export function useUpdateMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<MarketplaceItem> }) =>
      marketplaceApi.updateMarketplaceItem(itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'item', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my'] });
    },
  });
}

/**
 * 删除商品
 */
export function useDeleteMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketplaceApi.deleteMarketplaceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items', 'infinite'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my'] });
    },
  });
}

/**
 * 获取我的商品
 */
export function useMyMarketplaceItems(params?: MarketplaceQueryParams) {
  return useQuery({
    queryKey: ['marketplace', 'my', params],
    queryFn: () => marketplaceApi.getMyMarketplaceItems(params),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

/**
 * 标记为已售出
 */
export function useMarkAsSold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketplaceApi.markAsSold,
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my'] });
    },
  });
}

/**
 * 标记为已预订
 */
export function useMarkAsReserved() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketplaceApi.markAsReserved,
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my'] });
    },
  });
}

/**
 * 收藏/取消收藏商品
 */
export function useToggleMarketplaceFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, isFavorited }: { itemId: string; isFavorited: boolean }) =>
      isFavorited ? marketplaceApi.unfavoriteMarketplaceItem(itemId) : marketplaceApi.favoriteMarketplaceItem(itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'item', variables.itemId] });
    },
  });
}
