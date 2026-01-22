import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_CONFIG } from '@/config/constants';

// ============================================
// 通知 Socket 相关类型
// ============================================

interface NotificationSocketOptions {
  token?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onNewNotification?: (data: { type: string; content: string; relatedId?: string }) => void;
  onUnreadCountUpdate?: (data: { unreadCount: number }) => void;
  autoConnect?: boolean;
}

// ============================================
// 聊天 Socket 相关类型
// ============================================

interface ChatSocketOptions {
  token?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onNewMessage?: (data: { message: any; sender: any }) => void;
  onUnreadCountUpdate?: (data: { count: number }) => void;
  onUserTyping?: (data: { userId: string; conversationId: string }) => void;
  autoConnect?: boolean;
}

// ============================================
// 通知 Socket Hook
// ============================================

export const useNotificationSocket = (options: NotificationSocketOptions = {}) => {
  const {
    token,
    onConnect,
    onDisconnect,
    onError,
    onNewNotification,
    onUnreadCountUpdate,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    if (!token) {
      console.warn('[NotificationSocket] No token provided, skipping connection');
      return;
    }

    try {
      // 🔔 通知服务 (默认命名空间)
      socketRef.current = io(WS_CONFIG.url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: WS_CONFIG.reconnectInterval,
        reconnectionAttempts: WS_CONFIG.maxReconnectAttempts,
      });

      socketRef.current.on('connect', () => {
        console.log('[NotificationSocket] Connected');
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('[NotificationSocket] Disconnected:', reason);
        onDisconnect?.();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[NotificationSocket] Connection error:', error);
        onError?.(error);
      });

      // 监听新通知
      socketRef.current.on('notification:new', (data) => {
        console.log('[NotificationSocket] New notification:', data);
        onNewNotification?.(data);
      });

      // 监听通知未读数更新
      socketRef.current.on('notification:unread_count', (data) => {
        console.log('[NotificationSocket] Unread count:', data);
        onUnreadCountUpdate?.(data);
      });

      socketRef.current.on('notification:unread_count_updated', (data) => {
        console.log('[NotificationSocket] Unread count updated:', data);
        onUnreadCountUpdate?.(data);
      });

      socketRef.current.on('notification:read_success', (data) => {
        console.log('[NotificationSocket] Notification marked as read:', data);
      });

      socketRef.current.on('notification:all_read_success', (data) => {
        console.log('[NotificationSocket] All notifications marked as read:', data);
      });

      socketRef.current.on('system:online_count', (data) => {
        console.log('[NotificationSocket] Online users:', data);
      });

      socketRef.current.on('pong', (data) => {
        console.log('[NotificationSocket] Pong:', data);
      });
    } catch (error) {
      console.error('[NotificationSocket] Failed to connect:', error);
      onError?.(error as Error);
    }
  }, [token, onConnect, onDisconnect, onError, onNewNotification, onUnreadCountUpdate]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[NotificationSocket] Socket not connected, cannot emit:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  // 查询未读数
  const queryUnreadCount = useCallback(() => {
    emit('notification:unread_count');
  }, [emit]);

  // 标记通知为已读
  const markRead = useCallback((notificationId: string) => {
    emit('notification:mark_read', { notificationId });
  }, [emit]);

  // 标记所有通知为已读
  const markAllRead = useCallback(() => {
    emit('notification:mark_all_read');
  }, [emit]);

  // Ping
  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    connect,
    disconnect,
    emit,
    ping,
    queryUnreadCount,
    markRead,
    markAllRead,
  };
};

// ============================================
// 聊天 Socket Hook
// ============================================

export const useChatSocket = (options: ChatSocketOptions = {}) => {
  const {
    token,
    onConnect,
    onDisconnect,
    onError,
    onNewMessage,
    onUnreadCountUpdate,
    onUserTyping,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    if (!token) {
      console.warn('[ChatSocket] No token provided, skipping connection');
      return;
    }

    try {
      // 💬 聊天服务 (专用命名空间 /chat)
      socketRef.current = io(`${WS_CONFIG.url}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: WS_CONFIG.reconnectInterval,
        reconnectionAttempts: WS_CONFIG.maxReconnectAttempts,
      });

      socketRef.current.on('connect', () => {
        console.log('[ChatSocket] Connected');
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('[ChatSocket] Disconnected:', reason);
        onDisconnect?.();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[ChatSocket] Connection error:', error);
        onError?.(error);
      });

      // 监听新私信 (实时)
      socketRef.current.on('chat:message_created', (data) => {
        console.log('[ChatSocket] New message:', data);
        onNewMessage?.(data);
      });

      // 监听私信未读数更新
      socketRef.current.on('chat:unread_count', (data) => {
        console.log('[ChatSocket] Unread count:', data);
        onUnreadCountUpdate?.(data);
      });

      // 监听对方正在输入
      socketRef.current.on('chat:user_typing', (data) => {
        console.log('[ChatSocket] User typing:', data);
        onUserTyping?.(data);
      });

      // 加入聊天房间
      const joinConversation = (conversationId: string) => {
        emit('chat:join', { conversationId });
      };

      // 离开聊天房间
      const leaveConversation = (conversationId: string) => {
        emit('chat:leave', { conversationId });
      };

      // 发送正在输入状态
      const sendTyping = (conversationId: string) => {
        emit('chat:typing', { conversationId });
      };

      socketRef.current.on('pong', (data) => {
        console.log('[ChatSocket] Pong:', data);
      });
    } catch (error) {
      console.error('[ChatSocket] Failed to connect:', error);
      onError?.(error as Error);
    }
  }, [token, onConnect, onDisconnect, onError, onNewMessage, onUnreadCountUpdate, onUserTyping]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[ChatSocket] Socket not connected, cannot emit:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  // 加入聊天房间
  const joinConversation = useCallback((conversationId: string) => {
    emit('chat:join', { conversationId });
  }, [emit]);

  // 离开聊天房间
  const leaveConversation = useCallback((conversationId: string) => {
    emit('chat:leave', { conversationId });
  }, [emit]);

  // 发送正在输入状态
  const sendTyping = useCallback((conversationId: string) => {
    emit('chat:typing', { conversationId });
  }, [emit]);

  // Ping
  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    connect,
    disconnect,
    emit,
    ping,
    joinConversation,
    leaveConversation,
    sendTyping,
  };
};

// ============================================
// 旧的统一 WebSocket Hook (已弃用)
// ============================================

interface UseWebSocketOptions {
  url?: string;
  token?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onNotification?: (notification: any) => void;
  onUnreadCount?: (data: { unreadCount: number }) => void;
  autoConnect?: boolean;
}

/**
 * @deprecated 请使用 useNotificationSocket 或 useChatSocket 代替
 */
export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  console.warn('[useWebSocket] This hook is deprecated. Please use useNotificationSocket or useChatSocket instead.');
  return useNotificationSocket({
    token: options.token,
    onConnect: options.onConnect,
    onDisconnect: options.onDisconnect,
    onError: options.onError,
    onNewNotification: options.onNotification,
    onUnreadCountUpdate: options.onUnreadCount,
    autoConnect: options.autoConnect,
  });
};
