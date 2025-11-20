import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, followApi, searchApi } from '@/api';
import type { UpdateUserRequest } from '@/types';

// Note: getUsers is not available in USER_API, only in ADMIN_API
export const useUsers = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => {
      throw new Error('getUsers is only available in ADMIN_API');
    },
    enabled: false, // Disabled by default
    staleTime: 1000 * 60 * 10,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
};

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => searchApi.searchUsers({ q: query }),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updates }: { updates: UpdateUserRequest }) =>
      userApi.updateProfile(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => followApi.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => followApi.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUserPosts = (userId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['users', userId, 'posts', page, limit],
    queryFn: () => userApi.getUserPosts(userId, page, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserFollowers = (userId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['users', userId, 'followers', page, limit],
    queryFn: () => followApi.getFollowers(userId, { page, limit }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserFollowing = (userId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['users', userId, 'following', page, limit],
    queryFn: () => followApi.getFollowing(userId, { page, limit }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

