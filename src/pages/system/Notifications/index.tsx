import { useCallback, useEffect, useState } from 'react'
import { notificationApi, type NotificationType } from '@/api'
import { LoadingState, EmptyState, Button, Card } from '@/components'
import { formatTime } from '@/utils/format'
import { useUIStore } from '@/store/useUIStore'

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [isRead, setIsRead] = useState<'all' | 'unread' | 'read'>('all')
  const [type, setType] = useState<string>('')
  const { setUnreadNotifications } = useUIStore()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const isReadParam = isRead === 'unread' ? false : isRead === 'read' ? true : undefined
      const typeParam = type?.trim() ? (type.trim() as NotificationType) : undefined
      const res = await notificationApi.getNotifications({ page, limit, isRead: isReadParam, type: typeParam })
      setItems(res.data)
      const unreadRes = await notificationApi.getUnreadCount()
      setUnread(unreadRes.unreadCount)
      setUnreadNotifications(unreadRes.unreadCount)
    } finally {
      setLoading(false)
    }
  }, [page, limit, isRead, type, setUnreadNotifications])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    await load()
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
          {items.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{n.title || n.type}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.content}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{formatTime(n.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  {!n.isRead && (
                    <Button variant="outline" size="sm" onClick={() => markRead(n.id)}>
                      标记已读
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => remove(n.id)}>
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
