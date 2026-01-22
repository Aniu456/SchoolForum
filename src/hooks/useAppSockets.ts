/**
 * App 根组件 Socket 集成
 * 在 App 根组件中使用，监听全局通知和私信未读数
 */

import { useNotificationSocket, useChatSocket } from './useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

export const useAppSockets = () => {
  const { token } = useAuthStore();

  // ============================================
  // 🔔 通知 Socket (默认命名空间)
  // ============================================

  const notificationSocket = useNotificationSocket({
    token,
    autoConnect: !!token,
    onConnect: () => {
      console.log('[App] 通知服务已连接');
    },
    onDisconnect: () => {
      console.log('[App] 通知服务已断开');
    },
    onError: (error) => {
      console.error('[App] 通知服务连接错误:', error);
    },
    onNewNotification: (data) => {
      console.log('[App] 收到新通知:', data);
      // TODO: 更新通知列表
      // 显示浏览器通知
      if (Notification.permission === 'granted') {
        new Notification('新通知', {
          body: data.content,
          icon: '/favicon.ico',
        });
      }
    },
    onUnreadCountUpdate: (data) => {
      console.log('[App] 通知未读数更新:', data.unreadCount);
      // TODO: 更新 Header 通知铃铛红点
      // 可以存储到 zustand store 或其他状态管理
    },
  });

  // ============================================
  // 💬 聊天 Socket (命名空间 /chat)
  // ============================================

  const chatSocket = useChatSocket({
    token,
    autoConnect: !!token,
    onConnect: () => {
      console.log('[App] 聊天服务已连接');
    },
    onDisconnect: () => {
      console.log('[App] 聊天服务已断开');
    },
    onError: (error) => {
      console.error('[App] 聊天服务连接错误:', error);
    },
    onNewMessage: (data) => {
      console.log('[App] 收到新私信:', data);
      // TODO: 如果当前不在聊天窗口，显示提示
      // 如果当前在对应聊天窗口，直接追加消息到聊天列表
      if (Notification.permission === 'granted') {
        new Notification(`来自 ${data.sender?.nickname || '用户'} 的私信`, {
          body: data.message?.content || '',
          icon: data.sender?.avatar || '/favicon.ico',
        });
      }
    },
    onUnreadCountUpdate: (data) => {
      console.log('[App] 私信未读数更新:', data.count);
      // TODO: 更新底部导航栏或顶部 Header 的私信红点
    },
    onUserTyping: (data) => {
      console.log('[App] 对方正在输入:', data);
      // TODO: 如果在聊天窗口，显示"对方正在输入..."提示
    },
  });

  return {
    notificationSocket,
    chatSocket,
  };
};

/**
 * 在 App 根组件中的使用示例:
 *
 * ```tsx
 * import { useAppSockets } from '@/hooks/useAppSockets';
 *
 * function App() {
 *   const { notificationSocket, chatSocket } = useAppSockets();
 *
 *   return (
 *     <div>
 *       <Header>
 *         <NotificationBadge count={notificationUnreadCount} />
 *         <MessageBadge count={chatUnreadCount} />
 *       </Header>
 *       <Routes>...</Routes>
 *     </div>
 *   );
 * }
 * ```
 */
