/**
 * 私信相关 API
 * 根据功能设计文档 3.用户实时通信 / 消息功能
 */
import apiClient from '../core/client';
import type {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  SendMessageRequest,
  CreateConversationRequest,
  GetMessagesRequest,
  MarkMessagesAsReadRequest,
} from '@/types/message';

const messageApi = {
  // ============================================
  // 会话管理
  // ============================================

  /**
   * 获取会话列表
   * 按最近一条消息时间排序
   */
  getConversations: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ConversationsResponse> => {
    const response = await apiClient.get('/messages/conversations', { params });
    return response.data;
  },

  /**
   * 获取或创建会话
   * 如果与该用户的会话已存在，返回现有会话；否则创建新会话
   */
  getOrCreateConversation: async (
    data: CreateConversationRequest
  ): Promise<Conversation> => {
    const response = await apiClient.post('/messages/conversations', data);
    return response.data;
  },

  /**
   * 获取会话详情
   */
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await apiClient.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // ============================================
  // 消息管理
  // ============================================

  /**
   * 获取会话中的消息列表
   * 支持分页
   */
  getMessages: async (params: GetMessagesRequest): Promise<MessagesResponse> => {
    const { conversationId, ...queryParams } = params;
    const response = await apiClient.get(
      `/messages/conversations/${conversationId}/messages`,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * 发送消息
   */
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const response = await apiClient.post('/messages', data);
    return response.data;
  },

  /**
   * 标记消息为已读
   * 如果不传 messageIds，则标记该会话中所有未读消息为已读
   */
  markAsRead: async (data: MarkMessagesAsReadRequest): Promise<void> => {
    const { conversationId, messageIds } = data;
    await apiClient.patch(
      `/messages/conversations/${conversationId}/read`,
      { messageIds }
    );
  },

  /**
   * 删除消息
   * 物理删除
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  // ============================================
  // 统计信息
  // ============================================

  /**
   * 获取未读消息总数
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data.count;
  },
};

export default messageApi;
