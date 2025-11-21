/**
 * 私信相关 Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '@/api';
import type {
  SendMessageRequest,
  CreateConversationRequest,
  GetMessagesRequest,
} from '@/types/message';

// ============================================
// Query Keys
// ============================================
export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messageKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) =>
    [...messageKeys.all, 'conversation', conversationId, 'messages'] as const,
  unreadCount: () => [...messageKeys.all, 'unread-count'] as const,
};

// ============================================
// 会话相关 Hooks
// ============================================

/**
 * 获取会话列表
 */
export const useConversations = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...messageKeys.conversations(), params],
    queryFn: () => messageApi.getConversations(params),
  });
};

/**
 * 获取会话详情
 */
export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.conversation(conversationId),
    queryFn: () => messageApi.getConversation(conversationId),
    enabled: !!conversationId,
  });
};

/**
 * 创建或获取会话
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      messageApi.getOrCreateConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
};

// ============================================
// 消息相关 Hooks
// ============================================

/**
 * 获取消息列表
 */
export const useMessages = (params: GetMessagesRequest) => {
  return useQuery({
    queryKey: [...messageKeys.messages(params.conversationId), params],
    queryFn: () => messageApi.getMessages(params),
    enabled: !!params.conversationId,
  });
};

/**
 * 发送消息
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messageApi.sendMessage(data),
    onSuccess: (newMessage) => {
      // 更新会话列表
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      // 更新消息列表
      if (newMessage.conversationId) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.messages(newMessage.conversationId),
        });
      }
      // 更新未读数
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
};

/**
 * 删除消息
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageApi.deleteMessage(messageId),
    onSuccess: () => {
      // 刷新所有消息相关的查询
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
};

/**
 * 删除会话
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messageApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
};

// ============================================
// 统计信息 Hooks
// ============================================

/**
 * 获取未读消息总数
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: messageKeys.unreadCount(),
    queryFn: () => messageApi.getUnreadCount(),
    refetchInterval: 30000, // 每30秒刷新一次
  });
};
