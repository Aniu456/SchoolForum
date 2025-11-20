'use client'

import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { carpoolApi } from '@/api'
import { LoadingState, EmptyState, Button } from '@/components'
import type { CarpoolItem } from '@/types'
import { formatTime, formatNumber } from '@/utils/format'
import { useToast } from '@/utils/toast-hook'
import { useAuthStore } from '@/store/useAuthStore'

export default function CarpoolDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { showSuccess, showError } = useToast()
    const { user } = useAuthStore()
    const [joining, setJoining] = useState(false)

    const {
        data: item,
        isLoading,
        error,
        refetch,
    } = useQuery<CarpoolItem | undefined>({
        queryKey: ['carpool', 'detail', id],
        queryFn: async () => {
            if (!id) return undefined
            return carpoolApi.getCarpoolItem(id)
        },
        enabled: !!id,
    })

    if (!id) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState type="not-found" title="拼单信息不存在" description="缺少 ID" showHomeButton />
            </div>
        )
    }

    if (isLoading) {
        return <LoadingState message="加载拼单信息中..." />
    }

    if (error || !item) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState
                    type="error"
                    title="加载失败"
                    description="无法加载拼单详情，请稍后重试"
                    action={{ label: '重新加载', onClick: () => refetch() }}
                    showHomeButton
                />
            </div>
        )
    }

    const statusText =
        item.status === 'OPEN'
            ? '进行中'
            : item.status === 'FULL'
                ? '已满员'
                : item.status === 'COMPLETED'
                    ? '已完成'
                    : '已关闭'

    const progress = item.totalSeats ? (item.occupiedSeats / item.totalSeats) * 100 : 0

    const handleJoin = async () => {
        if (!user) {
            showError('请先登录后再加入拼单')
            return
        }

        if (item.status !== 'OPEN') {
            showError('当前拼单已结束或已满员')
            return
        }

        try {
            setJoining(true)
            await carpoolApi.joinCarpool(item.id, {})
            showSuccess('已提交加入申请')
            refetch()
        } catch {
            showError('操作失败，请稍后重试')
        } finally {
            setJoining(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <header className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-800">
                    <div className="mb-2 flex items-center gap-2 text-sm">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {item.type === 'CARPOOL'
                                ? '拼车'
                                : item.type === 'FOOD_ORDER'
                                    ? '拼外卖'
                                    : item.type === 'SHOPPING'
                                        ? '拼购物'
                                        : item.type === 'TICKET'
                                            ? '拼票'
                                            : '其他'}
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

                <section className="mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-wrap">{item.description}</p>
                    {item.departureLocation && item.arrivalLocation && (
                        <p>
                            路线：{item.departureLocation} → {item.arrivalLocation}
                        </p>
                    )}
                    {item.departureTime && <p>出发时间：{formatTime(item.departureTime)}</p>}
                </section>

                {item.totalSeats && (
                    <section className="mb-4">
                        <div className="mb-1 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>
                                人数：{item.occupiedSeats}/{item.totalSeats}
                            </span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </section>
                )}

                <section className="mb-6 text-sm text-gray-700 dark:text-gray-300">
                    {item.pricePerPerson && <p>人均费用：¥{item.pricePerPerson}</p>}
                    {item.deadline && <p>报名截止：{formatTime(item.deadline)}</p>}
                </section>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        返回
                    </Button>
                    {item.status === 'OPEN' && (
                        <Button variant="primary" onClick={handleJoin} disabled={joining}>
                            {joining ? '提交中...' : '加入拼单'}
                        </Button>
                    )}
                </div>
            </article>
        </div>
    )
}
