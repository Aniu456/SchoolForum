'use client'

import { Link, useParams } from 'react-router-dom'
import { Avatar, LoadingState, EmptyState, Button } from '@/components'
import { useMarketplaceItem } from '@/hooks/useMarketplace'
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
    const tradeMethodLabel = TRADE_METHOD_LABELS[item.tradeMethod] ?? item.tradeMethod

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
                            <span className="rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                {tradeMethodLabel}
                            </span>
                            {item.location && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {item.location}
                                </span>
                            )}
                        </div>

                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{item.description}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>👁️ {formatNumber(item.viewCount)}</span>
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

                        <div className="mt-4 flex gap-3">
                            <Button variant="primary">联系卖家</Button>
                            <Button variant="outline" onClick={() => window.history.back()}>
                                返回
                            </Button>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    )
}
