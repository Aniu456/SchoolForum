/**
 * 私信相关类型定义
 * 根据功能设计文档 3.用户实时通信 / 消息功能
 */

// ============================================
// 消息类型
// ============================================

/**
 * 私信消息
 */
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
}

/**
 * 会话
 */
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  // 会话中的另一个用户信息
  otherUser?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    isActive?: boolean;
  };
}

// ============================================
// 请求 DTO 类型
// ============================================

/**
 * 发送私信请求
 */
export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

/**
 * 创建会话请求
 */
export interface CreateConversationRequest {
  participantId: string;
}

/**
 * 获取消息列表请求
 */
export interface GetMessagesRequest {
  conversationId: string;
  page?: number;
  limit?: number;
}

/**
 * 标记消息已读请求
 */
export interface MarkMessagesAsReadRequest {
  conversationId: string;
  messageIds?: string[];
}

// ============================================
// 响应类型
// ============================================

/**
 * 会话列表响应
 */
export interface ConversationsResponse {
  data: Conversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalUnread: number; // 所有会话的未读消息总数
  };
}

/**
 * 消息列表响应
 */
export interface MessagesResponse {
  data: Message[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
