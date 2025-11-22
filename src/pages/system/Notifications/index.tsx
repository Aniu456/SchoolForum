import { useCallback, useEffect, useState } from 'react'
import { notificationApi, type NotificationType } from '@/api'
import { LoadingState, Button, Card } from '@/components'
import { formatTime } from '@/utils/format'
import { useUIStore } from '@/store/useUIStore'
import { useNavigate, Link } from 'react-router-dom'
import websocketService from '@/services/websocket'
import { useConversations, useDeleteConversation } from '@/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 通知分组合并接口
interface GroupedNotification {
  id: string // 使用第一条通知的ID
  type: NotificationType
  relatedId?: string
  title: string
  content: string
  createdAt: string
  isRead: boolean
  senderNames: string[] // 发送者昵称列表
  unreadCount: number // 未读数量
  totalCount: number // 总数量
  notifications: any[] // 原始通知列表
}

type MessageTab = 'messages' | 'replies' | 'mentions' | 'likes' | 'system';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [isRead, setIsRead] = useState<'all' | 'unread' | 'read'>('all')
  const [type] = useState<string>('')
  const { setUnreadNotifications } = useUIStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<MessageTab>('messages')

  // 私信会话数据
  const { data: conversationsData } = useConversations({ page: 1, limit: 50 })
  const deleteConversationMutation = useDeleteConversation()
  const conversations = conversationsData?.data || []
  const totalUnread = conversationsData?.meta.totalUnread || 0

  // 合并通知逻辑
  const mergeNotifications = useCallback((notifications: any[]): GroupedNotification[] => {
    const groupMap = new Map<string, any[]>()

    // 按不同规则分组：私信按发送者合并，评论/点赞按帖子合并
    notifications.forEach((n) => {
      let key: string

      if (n.type === 'SYSTEM' && n.senderId) {
        // 私信通知：按发送者ID合并（同一个用户的所有私信合并为一条）
        key = `SYSTEM_sender_${n.senderId}`
      } else if (['COMMENT', 'REPLY', 'LIKE'].includes(n.type) && n.relatedId) {
        // 评论、回复、点赞：按帖子ID合并
        key = `${n.type}_${n.relatedId}`
      } else {
        // 其他类型不合并
        key = `${n.id}_unique`
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, [])
      }
      groupMap.get(key)!.push(n)
    })

    // 转换为分组通知格式
    const grouped: GroupedNotification[] = []
    groupMap.forEach((group) => {
      const first = group[0]
      const unreadCount = group.filter((n) => !n.isRead).length
      const senderNames = [...new Set(group.map((n) => n.sender?.nickname || n.sender?.username || '未知用户').filter(Boolean))]

      // 生成合并后的内容
      const typeMap: Record<string, string> = {
        LIKE: '赞了你的帖子',
        COMMENT: '评论了你的帖子',
        REPLY: '回复了你的评论',
        SYSTEM: '给你发送了私信',
      }

      const mergedTitle = first.title || first.type
      let mergedContent = first.content

      if (group.length > 1) {
        if (senderNames.length === 1) {
          mergedContent = `${senderNames[0]} ${typeMap[first.type] || '通知'}`
        } else if (senderNames.length === 2) {
          mergedContent = `${senderNames[0]}、${senderNames[1]} ${typeMap[first.type] || '通知'}`
        } else {
          mergedContent = `${senderNames[0]} 等 ${senderNames.length} 人 ${typeMap[first.type] || '通知'}`
        }
      }

      grouped.push({
        id: first.id,
        type: first.type,
        relatedId: first.relatedId,
        title: mergedTitle,
        content: mergedContent,
        createdAt: group[group.length - 1].createdAt, // 使用最新的时间
        isRead: unreadCount === 0,
        senderNames,
        unreadCount,
        totalCount: group.length,
        notifications: group,
      })
    })

    // 按时间排序
    return grouped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const isReadParam = isRead === 'unread' ? false : isRead === 'read' ? true : undefined
      const typeParam = type?.trim() ? (type.trim() as NotificationType) : undefined
      const res = await notificationApi.getNotifications({ page, limit, isRead: isReadParam, type: typeParam })

      // 合并通知
      const merged = mergeNotifications(res.data)
      setItems(merged as any)

      const unreadRes = await notificationApi.getUnreadCount()
      setUnread(unreadRes.unreadCount)
      setUnreadNotifications(unreadRes.unreadCount)
    } finally {
      setLoading(false)
    }
  }, [page, limit, isRead, type, setUnreadNotifications, mergeNotifications])

  useEffect(() => {
    load()
  }, [load])

  // WebSocket 实时刷新通知列表
  useEffect(() => {
    const unsub = websocketService.subscribeNotification(() => {
      load()
    })
    return () => unsub?.()
  }, [load])

  const markRead = async (groupedNotification: GroupedNotification) => {
    // 批量标记该组所有未读通知为已读
    const unreadNotifications = groupedNotification.notifications.filter((n) => !n.isRead)

    if (unreadNotifications.length === 0) return

    try {
      // 对于私信、点赞、评论等有 relatedId 的通知，使用批量标记
      if (groupedNotification.relatedId && ['SYSTEM', 'LIKE', 'COMMENT', 'REPLY'].includes(groupedNotification.type)) {
        await notificationApi.markByRelated(groupedNotification.relatedId, groupedNotification.type)
      } else {
        // 其他类型逐条标记
        for (const n of unreadNotifications) {
          await notificationApi.markAsRead(n.id)
        }
      }
      await load()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const readAll = async () => {
    await notificationApi.markAllAsRead()
    await load()
  }

  const remove = async (id: string) => {
    await notificationApi.deleteNotification(id)
    await load()
  }

  // 侧边栏菜单项
  const sidebarItems = [
    { id: 'messages' as MessageTab, icon: '💬', label: '我的消息' },
    { id: 'replies' as MessageTab, icon: '💬', label: '回复我的' },
    { id: 'mentions' as MessageTab, icon: '@', label: '@我的' },
    { id: 'likes' as MessageTab, icon: '👍', label: '收到的赞' },
    { id: 'system' as MessageTab, icon: '🔔', label: '系统通知' },
  ]

  // 根据 activeTab 筛选通知
  const getFilteredNotifications = () => {
    if (activeTab === 'messages') return []
    if (activeTab === 'replies') return items.filter((n: GroupedNotification) => ['REPLY', 'COMMENT'].includes(n.type))
    if (activeTab === 'mentions') return [] // @我的功能待开发
    if (activeTab === 'likes') return items.filter((n: GroupedNotification) => n.type === 'LIKE')
    // 系统通知：只显示真正的系统通知，不包括私信（SYSTEM类型）
    if (activeTab === 'system') return items.filter((n: GroupedNotification) => n.type === 'NEW_FOLLOWER')
    return items
  }

  const filteredItems = getFilteredNotifications()

  // 计算每个标签的未读数
  const getTabUnreadCount = (tabId: MessageTab): number => {
    if (tabId === 'messages') return totalUnread
    if (tabId === 'replies') {
      return items.filter((n: GroupedNotification) =>
        ['REPLY', 'COMMENT'].includes(n.type) && n.unreadCount > 0
      ).reduce((sum, n) => sum + n.unreadCount, 0)
    }
    if (tabId === 'mentions') return 0 // @我的功能待开发
    if (tabId === 'likes') {
      return items.filter((n: GroupedNotification) =>
        n.type === 'LIKE' && n.unreadCount > 0
      ).reduce((sum, n) => sum + n.unreadCount, 0)
    }
    if (tabId === 'system') {
      return items.filter((n: GroupedNotification) =>
        n.type === 'NEW_FOLLOWER' && n.unreadCount > 0
      ).reduce((sum, n) => sum + n.unreadCount, 0)
    }
    return 0
  }

  if (loading) return <LoadingState message="加载中..." />

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
            {sidebarItems.map((item) => {
              const tabUnreadCount = getTabUnreadCount(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setPage(1)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'messages' && tabUnreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {tabUnreadCount}
                    </span>
                  )}
                  {item.id !== 'messages' && tabUnreadCount > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </button>
              )
            })}
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
                {activeTab === 'messages' && '我的消息'}
                {activeTab === 'replies' && '回复我的'}
                {activeTab === 'mentions' && '@我的'}
                {activeTab === 'likes' && '收到的赞'}
                {activeTab === 'system' && '系统通知'}
              </h1>
              {getTabUnreadCount(activeTab) > 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {getTabUnreadCount(activeTab)} 条未读{activeTab === 'messages' ? '消息' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {activeTab !== 'messages' && (
                <>
                  <select
                    value={isRead}
                    onChange={(e) => {
                      setPage(1)
                      setIsRead(e.target.value as 'all' | 'unread' | 'read')
                    }}
                    className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <option value="all">全部</option>
                    <option value="unread">未读</option>
                    <option value="read">已读</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={readAll}>
                    全部已读
                  </Button>
                </>
              )}
              {activeTab === 'messages' && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {conversations.length} 个会话
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* 我的消息 - 显示私信会话列表 */}
          {activeTab === 'messages' && (
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
                  {conversations.map((conversation: any) => {
                    const otherUser = conversation.otherUser
                    const lastMessage = conversation.lastMessage
                    const hasUnread = conversation.unreadCount > 0

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
                            if (deleteConversationMutation.isPending) return
                            try {
                              await deleteConversationMutation.mutateAsync(conversation.id)
                            } catch (err) {
                              alert((err as any)?.message || '删除失败')
                            }
                          }}
                          className="absolute right-4 top-4 h-7 w-7 shrink-0 rounded-full border border-gray-300 bg-white text-gray-500 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          title="删除会话"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* 其他标签 - 显示通知列表 */}
          {activeTab !== 'messages' && (
            <>
              {filteredItems.length === 0 ? (
                <div className="mt-12 text-center">
                  <div className="mb-4 text-6xl">🔔</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    暂无通知
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    当前没有新的通知
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredItems.map((n: GroupedNotification) => {
                      const isPm = n.type === 'SYSTEM'
                      const isPostRelated = ['LIKE', 'COMMENT', 'REPLY'].includes(n.type) && n.relatedId

                      const go = async () => {
                        if (isPm) {
                          // 私信通知：使用最新一条消息的 relatedId（会话ID）
                          const latestNotification = n.notifications[n.notifications.length - 1]
                          if (latestNotification?.relatedId) {
                            navigate(`/messages/${latestNotification.relatedId}`)
                            await markRead(n)
                          }
                        } else if (isPostRelated && n.relatedId) {
                          navigate(`/posts/${n.relatedId}`)
                          await markRead(n)
                        } else if (n.type === 'NEW_FOLLOWER' && n.notifications[0]?.senderId) {
                          navigate(`/users/${n.notifications[0].senderId}`)
                          await markRead(n)
                        }
                      }

                      return (
                        <Card key={n.id} className="p-4 transition-all hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div onClick={go} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{n.title || n.type}</div>
                                {n.unreadCount > 0 && (
                                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                                    {n.unreadCount} 未读
                                  </span>
                                )}
                                {n.totalCount > 1 && (
                                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    共 {n.totalCount} 条
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.content}</div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{formatTime(n.createdAt)}</div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {n.unreadCount > 0 && (
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.stopPropagation()
                                  markRead(n)
                                }}>
                                  已读
                                </Button>
                              )}
                              {!isPm && (
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.stopPropagation()
                                  remove(n.id)
                                }}>
                                  删除
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>

                  {/* 分页 */}
                  {filteredItems.length > 0 && (
                    <div className="mt-6 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        第 {page} 页
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}>
                          上一页
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
