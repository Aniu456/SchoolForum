'use client'

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, LoadingState, EmptyState, Button, ConfirmDialog } from '@/components'
import { useMarketplaceItem, useDeleteMarketplaceItem } from '@/hooks/useMarketplace'
import { useAuthStore } from '@/store/useAuthStore'
import { messageApi } from '@/api'
import { useToast } from '@/utils/toast-hook'
import { formatNumber, formatTime } from '@/utils/format'

const CONDITION_LABELS: Record<string, string> = {
    NEW: '全新',
    LIKE_NEW: '几乎全新',
    GOOD: '良好',
    FAIR: '一般',
    POOR: '较差',
}

const TRADE_METHOD_LABELS: Record<string, string> = {
    MEET: '当面交易',
    DELIVERY: '邮寄',
    BOTH: '当面或邮寄',
}

export default function MarketplaceDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()
    const deleteMutation = useDeleteMarketplaceItem()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { data: item, isLoading, error, refetch } = useMarketplaceItem(id || '')

    if (!id) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState type="not-found" title="商品不存在" description="缺少商品 ID" showHomeButton />
            </div>
        )
    }

    if (isLoading) {
        return <LoadingState message="加载商品中..." />
    }

    if (error || !item) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState
                    type="error"
                    title="加载失败"
                    description="无法加载商品详情，请稍后重试"
                    action={{ label: '重新加载', onClick: () => refetch() }}
                    showHomeButton
                />
            </div>
        )
    }

    const conditionLabel = CONDITION_LABELS[item.condition] ?? item.condition
    const tradeMethodLabel = item.tradeMethod ? (TRADE_METHOD_LABELS[item.tradeMethod] ?? item.tradeMethod) : undefined
    const isOwner = Boolean(user && (user.id === item.sellerId || user.id === item.seller?.id))

    const handleCopyContact = async () => {
        if (!item.contact) {
            showError('卖家未提供联系方式')
            return
        }
        try {
            await navigator.clipboard.writeText(item.contact)
            showSuccess('已复制卖家联系方式')
        } catch {
            showError('复制失败，请手动复制')
        }
    }

    const handleMessage = async () => {
        if (!item.seller?.id && !item.sellerId) {
            showError('未找到卖家信息')
            return
        }
        if (!user) {
            showError('请先登录再联系卖家')
            navigate('/login')
            return
        }
        try {
            const conversation = await messageApi.getOrCreateConversation({
                participantId: item.seller?.id || item.sellerId,
            })
            navigate(`/messages/${conversation.id}`)
        } catch {
            showError('打开私信失败，请稍后重试')
        }
    }

    const handleDelete = async () => {
        if (!id) return
        try {
            await deleteMutation.mutateAsync(id)
            showSuccess('商品已删除')
            navigate('/marketplace')
        } catch {
            showError('删除失败，请稍后再试')
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                    <div>
                        <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
                            {item.images && item.images[0] ? (
                                <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-5xl text-gray-400">📦</div>
                            )}
                        </div>
                        {item.images && item.images.length > 1 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto">
                                {item.images.slice(1).map((url) => (
                                    <img key={url} src={url} alt={item.title} className="h-16 w-16 rounded-md object-cover" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h1>

                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-red-600">¥{item.price}</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-sm text-gray-400 line-through">¥{item.originalPrice}</span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {conditionLabel}
                            </span>
                            {tradeMethodLabel && (
                                <span className="rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                    {tradeMethodLabel}
                                </span>
                            )}
                            {item.location && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {item.location}
                                </span>
                            )}
                        </div>

                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{item.description}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span> {formatNumber(item.viewCount)}</span>
                            <span>发布时间 {formatTime(item.createdAt)}</span>
                        </div>

                        {item.seller && (
                            <div className="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                                <Avatar
                                    src={item.seller.avatar}
                                    alt={item.seller.username}
                                    username={item.seller.username}
                                    size={40}
                                    seed={item.seller.id}
                                />
                                <div className="flex-1">
                                    <Link
                                        to={`/users/${item.seller.id}`}
                                        className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                                    >
                                        {item.seller.nickname || item.seller.username}
                                    </Link>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">卖家</div>
                                </div>
                            </div>
                        )}

                        {item.contact && (
                            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                                <div className="flex flex-col">
                                    <span className="font-semibold">联系方式</span>
                                    <span className="break-all text-blue-800 dark:text-blue-100">{item.contact}</span>
                                </div>
                                <Button size="sm" variant="secondary" onClick={handleCopyContact}>
                                    复制
                                </Button>
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                            {!isOwner && (
                                <>
                                    <Button variant="primary" onClick={handleMessage}>私信卖家</Button>
                                </>
                            )}
                            {isOwner && (
                                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} isLoading={deleteMutation.isPending}>
                                    删除商品
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => window.history.back()}>
                                返回
                            </Button>
                        </div>
                    </div>
                </div>
            </article>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="删除商品"
                description="删除后无法恢复，确定要删除该商品吗？"
                confirmText="删除"
                cancelText="取消"
                type="danger"
                onConfirm={handleDelete}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </div>
    )
}
