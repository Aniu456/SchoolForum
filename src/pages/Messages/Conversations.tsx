/**
 * 会话列表页面
 * 显示所有私信会话，按最近消息时间排序
 */
import { Link } from 'react-router-dom';
import { useConversations } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ConversationsPage() {
  const { data, isLoading, error } = useConversations({ page: 1, limit: 50 });

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          加载失败：{error instanceof Error ? error.message : '未知错误'}
        </div>
      </div>
    );
  }

  const conversations = data?.data || [];
  const totalUnread = data?.meta.totalUnread || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            私信
          </h1>
          {totalUnread > 0 && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {totalUnread} 条未读消息
            </p>
          )}
        </div>
      </div>

      {/* 会话列表 */}
      {conversations.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-12 text-center dark:bg-gray-800">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            暂无私信
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            开始与其他用户聊天吧
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const otherUser = conversation.otherUser;
            const lastMessage = conversation.lastMessage;
            const hasUnread = conversation.unreadCount > 0;

            return (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.id}`}
                className={`block rounded-lg border p-4 transition-all hover:shadow-md ${
                  hasUnread
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}>
                <div className="flex items-start gap-4">
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.nickname}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 text-lg font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                        {otherUser?.nickname?.[0] || '?'}
                      </div>
                    )}
                    {/* 在线状态 */}
                    {otherUser?.isActive && (
                      <div className="relative -mt-3 ml-9">
                        <div className="h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-800"></div>
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h3
                        className={`truncate text-lg ${
                          hasUnread
                            ? 'font-bold text-gray-900 dark:text-gray-100'
                            : 'font-semibold text-gray-800 dark:text-gray-200'
                        }`}>
                        {otherUser?.nickname || '未知用户'}
                      </h3>
                      {lastMessage && (
                        <span className="ml-2 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      )}
                    </div>

                    {lastMessage && (
                      <p
                        className={`truncate text-sm ${
                          hasUnread
                            ? 'font-medium text-gray-700 dark:text-gray-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                        {lastMessage.content}
                      </p>
                    )}

                    {/* 未读数徽章 */}
                    {hasUnread && (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          {conversation.unreadCount} 条未读
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
