import { useCallback, useEffect, useState } from 'react'
import { notificationApi, type NotificationType } from '@/api'
import { LoadingState, EmptyState, Button, Card } from '@/components'
import { formatTime } from '@/utils/format'
import { useUIStore } from '@/store/useUIStore'
import { useNavigate } from 'react-router-dom'
import websocketService from '@/services/websocket'

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

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [isRead, setIsRead] = useState<'all' | 'unread' | 'read'>('all')
  const [type, setType] = useState<string>('')
  const { setUnreadNotifications } = useUIStore()
  const navigate = useNavigate()

  // 合并通知逻辑
  const mergeNotifications = useCallback((notifications: any[]): GroupedNotification[] => {
    const groupMap = new Map<string, any[]>()

    // 按 type + relatedId 分组（私信、评论、点赞、收藏按帖子合并，关注不合并）
    notifications.forEach((n) => {
      const shouldGroup = ['COMMENT', 'REPLY', 'LIKE', 'SYSTEM'].includes(n.type) && n.relatedId
      const key = shouldGroup ? `${n.type}_${n.relatedId}` : `${n.id}_unique`

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

  if (loading) return <LoadingState message="加载通知中..." />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">通知 ({unread} 未读)</h1>
        <div className="flex items-center gap-3">
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
          <input
            value={type}
            onChange={(e) => {
              setPage(1)
              setType(e.target.value)
            }}
            placeholder="类型筛选（可选）"
            className="w-40 rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(Number(e.target.value))
            }}
            className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <Button variant="outline" size="sm" onClick={readAll}>
            全部标记为已读
          </Button>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          第 {page} 页，每页 {limit} 条
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (page > 1) {
                setPage(page - 1)
              }
            }}>
            上一页
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
            下一页
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState title="暂无通知" description="当前没有新的通知" icon="🔔" />
      ) : (
        <div className="space-y-4">
          {items.map((n: GroupedNotification) => {
            const isPm = n.type === 'SYSTEM' && n.relatedId
            const isPostRelated = ['LIKE', 'COMMENT', 'REPLY'].includes(n.type) && n.relatedId

            const go = async () => {
              // 点击后跳转并标记已读
              if (isPm && n.relatedId) {
                navigate(`/messages/${n.relatedId}`)
                await markRead(n)
              } else if (isPostRelated && n.relatedId) {
                navigate(`/posts/${n.relatedId}`)
                await markRead(n)
              } else if (n.type === 'NEW_FOLLOWER' && n.notifications[0]?.senderId) {
                navigate(`/users/${n.notifications[0].senderId}`)
                await markRead(n)
              }
            }

            return (
              <Card key={n.id} className="p-4">
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
                  <div className="flex flex-shrink-0 gap-2">
                    {n.unreadCount > 0 && (
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        markRead(n)
                      }}>
                        标记已读
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
      )}
    </div>
  )
}
