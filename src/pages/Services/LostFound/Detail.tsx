'use client'

import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { lostfoundApi } from '@/api'
import { LoadingState, EmptyState, Button } from '@/components'
import type { LostFoundItem } from '@/types'
import { formatTime, formatNumber } from '@/utils/format'
import { useToast } from '@/utils/toast-hook'
import { useAuthStore } from '@/store/useAuthStore'

export default function LostFoundDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { showSuccess, showError } = useToast()
    const { user } = useAuthStore()
    const [marking, setMarking] = useState(false)

    const {
        data: item,
        isLoading,
        error,
        refetch,
    } = useQuery<LostFoundItem | undefined>({
        queryKey: ['lostfound', 'detail', id],
        queryFn: async () => {
            if (!id) return undefined
            return lostfoundApi.getLostFoundItem(id)
        },
        enabled: !!id,
    })

    if (!id) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState type="not-found" title="信息不存在" description="缺少 ID" showHomeButton />
            </div>
        )
    }

    if (isLoading) {
        return <LoadingState message="加载信息中..." />
    }

    if (error || !item) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState
                    type="error"
                    title="加载失败"
                    description="无法加载失物招领详情，请稍后重试"
                    action={{ label: '重新加载', onClick: () => refetch() }}
                    showHomeButton
                />
            </div>
        )
    }

    const handleMarkClaimed = async () => {
        if (!user) {
            showError('请先登录后再操作')
            return
        }

        try {
            setMarking(true)
            await lostfoundApi.markAsClaimed(item.id)
            showSuccess('已标记为已认领')
            refetch()
        } catch {
            showError('操作失败，请稍后重试')
        } finally {
            setMarking(false)
        }
    }

    const isLost = item.type === 'LOST'
    const statusText =
        item.status === 'OPEN' ? '进行中' : item.status === 'CLAIMED' ? '已认领' : '已关闭'

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <header className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-800">
                    <div className="mb-2 flex items-center gap-2 text-sm">
                        <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${isLost ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}
                        >
                            {isLost ? '寻物' : '招领'}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {statusText}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        发布于 {formatTime(item.createdAt)} · {formatNumber(item.viewCount)} 次浏览
                    </p>
                </header>

                {item.images && item.images.length > 0 && (
                    <div className="mb-4 flex gap-2 overflow-x-auto">
                        {item.images.map((url) => (
                            <img key={url} src={url} alt={item.title} className="h-32 w-32 rounded-md object-cover" />
                        ))}
                    </div>
                )}

                <section className="mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-wrap">{item.description}</p>
                    <p>地点：{item.location}</p>
                    <p>时间：{formatTime(item.lostOrFoundDate)}</p>
                </section>

                <section className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                    <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">联系方式</h2>
                    <p>联系人：{item.contactInfo.name || '未填写'}</p>
                    {item.contactInfo.phone && <p>电话：{item.contactInfo.phone}</p>}
                    {item.contactInfo.wechat && <p>微信：{item.contactInfo.wechat}</p>}
                    {item.contactInfo.qq && <p>QQ：{item.contactInfo.qq}</p>}
                </section>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        返回
                    </Button>
                    {item.status === 'OPEN' && !isLost && (
                        <Button variant="primary" onClick={handleMarkClaimed} disabled={marking}>
                            {marking ? '提交中...' : '标记为已认领'}
                        </Button>
                    )}
                </div>
            </article>
        </div>
    )
}
