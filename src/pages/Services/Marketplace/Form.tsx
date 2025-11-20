'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { useCreateMarketplaceItem } from '@/hooks/useMarketplace'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { ItemCategory, ItemCondition, TradeMethod, CreateMarketplaceItemRequest } from '@/types'

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
    { value: 'ELECTRONICS', label: '电子产品' },
    { value: 'BOOKS', label: '书籍教材' },
    { value: 'CLOTHING', label: '服装配饰' },
    { value: 'SPORTS', label: '运动器材' },
    { value: 'FURNITURE', label: '家具用品' },
    { value: 'STATIONERY', label: '文具用品' },
    { value: 'DAILY', label: '日用品' },
    { value: 'OTHER', label: '其他' },
]

const CONDITION_OPTIONS: { value: ItemCondition; label: string }[] = [
    { value: 'NEW', label: '全新' },
    { value: 'LIKE_NEW', label: '几乎全新' },
    { value: 'GOOD', label: '良好' },
    { value: 'FAIR', label: '一般' },
    { value: 'POOR', label: '较差' },
]

const TRADE_METHOD_OPTIONS: { value: TradeMethod; label: string }[] = [
    { value: 'MEET', label: '当面交易' },
    { value: 'DELIVERY', label: '邮寄' },
    { value: 'BOTH', label: '当面或邮寄' },
]

export default function MarketplaceFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()
    const createMutation = useCreateMarketplaceItem()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [originalPrice, setOriginalPrice] = useState('')
    const [category, setCategory] = useState<ItemCategory>('ELECTRONICS')
    const [condition, setCondition] = useState<ItemCondition>('LIKE_NEW')
    const [tradeMethod, setTradeMethod] = useState<TradeMethod>('MEET')
    const [location, setLocation] = useState('')
    const [imageUrls, setImageUrls] = useState('')
    const [isAnonymous, setIsAnonymous] = useState(false)

    if (!user) {
        navigate('/login')
        return <LoadingState message="正在跳转到登录页..." />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            showError('请输入标题')
            return
        }

        if (!description.trim()) {
            showError('请输入描述')
            return
        }

        const priceNumber = Number(price)
        if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
            showError('请输入有效的价格')
            return
        }

        const images = imageUrls
            .split(/\n|,/)
            .map((url) => url.trim())
            .filter((url) => url)

        if (images.length === 0) {
            showError('请至少上传一张图片（填写图片 URL）')
            return
        }

        const payload: CreateMarketplaceItemRequest = {
            title: title.trim(),
            description: description.trim(),
            price: priceNumber,
            originalPrice: originalPrice ? Number(originalPrice) || undefined : undefined,
            category,
            condition,
            images,
            tradeMethod,
            location: location || undefined,
            isAnonymous,
        }

        try {
            await createMutation.mutateAsync(payload)
            showSuccess('商品发布成功')
            navigate('/marketplace')
        } catch {
            showError('发布失败，请稍后重试')
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">发布二手商品</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：九成新 iPad 平板"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={5}
                        placeholder="介绍一下物品情况、成色、使用时间等"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">价格 (¥)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            min={0}
                            step={0.01}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">原价 (可选)</label>
                        <input
                            type="number"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            min={0}
                            step={0.01}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ItemCategory)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">成色</label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value as ItemCondition)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {CONDITION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">交易方式</label>
                        <select
                            value={tradeMethod}
                            onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {TRADE_METHOD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">交易地点 (可选)</label>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：东门、图书馆门口"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">图片 URL（每行一条或用逗号分隔）</label>
                    <textarea
                        value={imageUrls}
                        onChange={(e) => setImageUrls(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={3}
                        placeholder="https://example.com/image1.jpg"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>匿名发布（对其他用户隐藏个人信息）</span>
                </label>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                        {createMutation.isPending ? '发布中...' : '发布商品'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
