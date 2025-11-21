/**
 * 私信相关 API
 * 根据功能设计文档 3.用户实时通信 / 消息功能
 */
import apiClient, { api } from '../core/client';
import type {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  SendMessageRequest,
  CreateConversationRequest,
  GetMessagesRequest,
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
    return await api.get('/conversations', { params });
  },

  /**
   * 获取或创建会话
   * 如果与该用户的会话已存在，返回现有会话；否则创建新会话
   */
  getOrCreateConversation: async (
    data: CreateConversationRequest
  ): Promise<Conversation> => {
    return await api.post('/conversations', data);
  },

  /**
   * 获取会话详情
   */
  getConversation: async (conversationId: string): Promise<Conversation> => {
    return await api.get(`/conversations/${conversationId}`);
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
    return await api.get(
      `/conversations/${conversationId}/messages`,
      { params: queryParams }
    );
  },

  /**
   * 发送消息
   */
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const { conversationId, content } = data;
    return await api.post(`/conversations/${conversationId}/messages`, { content });
  },

  /**
   * 删除消息
   * 物理删除
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/conversations/messages/${messageId}`);
  },

  // ============================================
  // 统计信息
  // ============================================

  /**
   * 获取未读消息总数
   */
  getUnreadCount: async (): Promise<number> => {
    const data = await api.get<{ count: number }>('/conversations/unread-count');
    return data.count;
  },

  /**
   * 删除会话
   * DELETE /conversations/:id
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },
};

export default messageApi;
