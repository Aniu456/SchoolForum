import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_CONFIG } from '@/config/constants';

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

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = WS_CONFIG.url,
    token,
    onConnect,
    onDisconnect,
    onError,
    onNotification,
    onUnreadCount,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    if (!token) {
      console.warn('[WebSocket] No token provided, skipping connection');
      return;
    }

    try {
      socketRef.current = io(url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: WS_CONFIG.reconnectInterval,
        reconnectionAttempts: WS_CONFIG.maxReconnectAttempts,
      });

      socketRef.current.on('connect', () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        onDisconnect?.();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        onError?.(error);

        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= WS_CONFIG.maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
          socketRef.current?.disconnect();
        }
      });

      // 监听通知事件
      socketRef.current.on('notification:new', (data) => {
        console.log('[WebSocket] New notification:', data);
        onNotification?.(data);
      });

      socketRef.current.on('notification:unread_count', (data) => {
        console.log('[WebSocket] Unread count:', data);
        onUnreadCount?.(data);
      });

      socketRef.current.on('notification:unread_count_updated', (data) => {
        console.log('[WebSocket] Unread count updated:', data);
        onUnreadCount?.(data);
      });

      socketRef.current.on('notification:read_success', (data) => {
        console.log('[WebSocket] Notification marked as read:', data);
      });

      socketRef.current.on('notification:all_read_success', (data) => {
        console.log('[WebSocket] All notifications marked as read:', data);
      });

      socketRef.current.on('system:online_count', (data) => {
        console.log('[WebSocket] Online users:', data);
      });

      socketRef.current.on('pong', (data) => {
        console.log('[WebSocket] Pong:', data);
      });
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      onError?.(error as Error);
    }
  }, [url, token, onConnect, onDisconnect, onError, onNotification, onUnreadCount]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[WebSocket] Socket not connected, cannot emit:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  const queryUnreadCount = useCallback(() => {
    emit('notification:unread_count');
  }, [emit]);

  const markRead = useCallback((notificationId: string) => {
    emit('notification:mark_read', { notificationId });
  }, [emit]);

  const markAllRead = useCallback(() => {
    emit('notification:mark_all_read');
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
