/**
 * 聊天窗口页面
 * 显示与某个用户的完整对话
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useDeleteMessage,
} from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/store/useAuthStore';
import { notificationApi } from '@/api';
import { useUIStore } from '@/store/useUIStore';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '@/services/websocket';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { setUnreadNotifications, setActiveConversationId } = useUIStore();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 验证 conversationId 是否存在
  useEffect(() => {
    if (!conversationId) {
      console.error('缺少会话 ID');
      navigate('/messages', { replace: true });
    }
  }, [conversationId, navigate]);

  const { data: conversation, isError: conversationError } = useConversation(conversationId || '');
  const { data: messagesData, isLoading, refetch: refetchMessages } = useMessages({
    conversationId: conversationId || '',
    page: 1,
    limit: 100,
  });
  const sendMessageMutation = useSendMessage();
  const deleteMessageMutation = useDeleteMessage();

  const messages = messagesData?.data || [];
  const otherUser = conversation?.otherUser;

  // 进入会话时标记相关通知为已读，并刷新通知数
  useEffect(() => {
    const markRelatedNotifications = async () => {
      if (!conversationId) return;
      try {
        await notificationApi.markByRelated(conversationId, 'SYSTEM' as any);
        const unreadRes = await notificationApi.getUnreadCount();
        setUnreadNotifications(unreadRes.unreadCount || 0);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      } catch (err) {
        console.warn('标记私信通知已读失败', err);
      }
    };
    markRelatedNotifications();
  }, [conversationId, setUnreadNotifications, queryClient]);

  // 标记当前会话为活跃，离开时清空
  useEffect(() => {
    setActiveConversationId(conversationId || null);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  // 在聊天中收到对应会话的通知时，立即标记已读并刷新消息
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = websocketService.subscribeNotification((notification) => {
      if (notification?.type === 'SYSTEM' && notification?.relatedId === conversationId) {
        void refetchMessages();
        void notificationApi.markByRelated(conversationId, 'SYSTEM' as any);
        notificationApi.getUnreadCount().then((res) => {
          setUnreadNotifications(res.unreadCount || 0);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        });
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [conversationId, refetchMessages, setUnreadNotifications, queryClient]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (messageId: string) => {
    if (!messageId) return;
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      await refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除消息失败，请重试');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageInput.trim(),
      });
      setMessageInput('');
      scrollToBottom();
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败，请重试');
    }
  };

  // 如果没有 conversationId，不渲染内容（useEffect 会处理重定向）
  if (!conversationId) {
    return null;
  }

  // 如果会话加载失败，显示错误
  if (conversationError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">加载会话失败，请返回重试</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            返回消息列表
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={() => navigate('/messages')}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {otherUser && (
          <>
            {otherUser.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.nickname}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                {otherUser.nickname[0]}
              </div>
            )}

            <div className="flex-1">
              <Link
                to={`/users/${otherUser.id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                {otherUser.nickname}
              </Link>
              {otherUser.isActive && (
                <p className="text-xs text-green-600 dark:text-green-400">在线</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            暂无消息，开始聊天吧
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMyMessage = message.senderId === currentUser?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isMyMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                    <p className="break-words">{message.content}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p
                        className={`text-xs ${isMyMessage
                          ? 'text-blue-200'
                          : 'text-gray-500 dark:text-gray-400'
                          }`}>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                      {isMyMessage && (
                        <button
                          type="button"
                          onClick={() => handleDelete(message.id)}
                          className="text-xs text-gray-200/80 underline decoration-dotted hover:text-white dark:text-gray-400 dark:hover:text-gray-100">
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框区域 */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="表情">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="图片">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* 输入框 */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="请输入消息内容"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                disabled={sendMessageMutation.isPending}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>按 Enter 发送，Shift + Enter 换行</span>
                <span>{messageInput.length}/500</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {sendMessageMutation.isPending ? '发送中...' : '发送'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
