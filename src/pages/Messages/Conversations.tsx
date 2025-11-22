/**
 * 会话列表页面
 * 显示所有私信会话，按最近消息时间排序
 */
import { Link, useNavigate } from 'react-router-dom';
import { useConversations, useDeleteConversation } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useState } from 'react';

type MessageTab = 'my-messages' | 'replies' | 'mentions' | 'likes' | 'system';

export default function ConversationsPage() {
  const { data, isLoading, error } = useConversations({ page: 1, limit: 50 });
  const navigate = useNavigate();
  const deleteConversationMutation = useDeleteConversation();
  const [activeTab, setActiveTab] = useState<MessageTab>('my-messages');

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

  // 侧边栏菜单项
  const sidebarItems = [
    { id: 'my-messages' as MessageTab, icon: '💬', label: '我的消息', active: true },
    { id: 'replies' as MessageTab, icon: '💬', label: '回复我的', active: false },
    { id: 'mentions' as MessageTab, icon: '@', label: '@我的', active: false },
    { id: 'likes' as MessageTab, icon: '👍', label: '收到的赞', active: false },
    { id: 'system' as MessageTab, icon: '🔔', label: '系统通知', active: false },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl">
      {/* 左侧边栏 */}
      <div className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="p-4">
          <div className="mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-lg font-semibold">消息中心</span>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}>
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={() => navigate('/settings')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>消息设置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {/* 头部 */}
        <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {activeTab === 'my-messages' && '我的消息'}
                {activeTab === 'replies' && '回复我的'}
                {activeTab === 'mentions' && '@我的'}
                {activeTab === 'likes' && '收到的赞'}
                {activeTab === 'system' && '系统通知'}
              </h1>
              {totalUnread > 0 && activeTab === 'my-messages' && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {totalUnread} 条未读消息
                </p>
              )}
            </div>
            {activeTab === 'my-messages' && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {conversations.length} 个会话
              </span>
            )}
          </div>
        </div>

        {/* 会话列表 */}
        <div className="p-4">
          {activeTab === 'my-messages' && (
            <>
              {conversations.length === 0 ? (
                <div className="mt-12 text-center">
                  <div className="mb-4 text-6xl">💬</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    暂无私信
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    开始与其他用户聊天吧
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation) => {
                    const otherUser = conversation.otherUser;
                    const lastMessage = conversation.lastMessage;
                    const hasUnread = conversation.unreadCount > 0;

                    return (
                      <div
                        key={conversation.id}
                        className="group relative rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
                      >
                        <Link to={`/messages/${conversation.id}`} className="flex items-start gap-4">
                          <div className="shrink-0">
                            {otherUser?.avatar ? (
                              <img
                                src={otherUser.avatar}
                                alt={otherUser.nickname}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                                {otherUser?.nickname?.[0] || '?'}
                              </div>
                            )}
                            {otherUser?.isActive && (
                              <div className="relative -mt-3 ml-9">
                                <div className="h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></div>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <h3
                                className={`truncate text-base ${hasUnread
                                  ? 'font-bold text-gray-900 dark:text-gray-100'
                                  : 'font-semibold text-gray-800 dark:text-gray-200'
                                  }`}
                              >
                                {otherUser?.nickname || '未知用户'}
                              </h3>
                              {lastMessage && (
                                <span className="ml-2 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(lastMessage.createdAt), {
                                    addSuffix: true,
                                    locale: zhCN,
                                  })}
                                </span>
                              )}
                            </div>

                            {lastMessage && (
                              <p
                                className={`truncate text-sm ${hasUnread
                                  ? 'font-medium text-gray-700 dark:text-gray-300'
                                  : 'text-gray-600 dark:text-gray-400'
                                  }`}
                              >
                                {lastMessage.content}
                              </p>
                            )}

                            {hasUnread && (
                              <div className="mt-2">
                                <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                  {conversation.unreadCount} 条未读
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        <button
                          onClick={async () => {
                            if (deleteConversationMutation.isPending) return;
                            try {
                              await deleteConversationMutation.mutateAsync(conversation.id);
                            } catch (err) {
                              alert((err as any)?.message || '删除失败');
                            }
                          }}
                          className="absolute right-4 top-4 h-7 w-7 shrink-0 rounded-full border border-gray-300 bg-white text-gray-500 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          title="删除会话"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* 其他标签的占位内容 */}
          {activeTab !== 'my-messages' && (
            <div className="mt-12 text-center">
              <div className="mb-4 text-6xl">🚧</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                功能开发中
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                该功能即将上线，敬请期待
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
