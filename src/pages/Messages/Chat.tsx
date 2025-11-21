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

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
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

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (messageId: string) => {
    if (!messageId) return;
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      await refetchMessages();
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
    <div className="container mx-auto flex h-screen max-h-[calc(100vh-4rem)] flex-col px-4 py-4">
      {/* 头部 */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-lg font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-300">
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
      <div className="mb-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
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
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${isMyMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${isMyMessage
                        ? 'text-blue-200'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}>
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </p>
                    {isMyMessage && (
                      <div className="mt-1 text-right text-xs text-gray-200/80 dark:text-gray-400">
                        <button
                          type="button"
                          onClick={() => handleDelete(message.id)}
                          className="underline decoration-dotted hover:text-white dark:hover:text-gray-100">
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          disabled={sendMessageMutation.isPending}
        />
        <button
          type="submit"
          disabled={!messageInput.trim() || sendMessageMutation.isPending}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {sendMessageMutation.isPending ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
}
