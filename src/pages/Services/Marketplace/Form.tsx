'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { useCreateMarketplaceItem } from '@/hooks/useMarketplace'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { ItemCategory, ItemCondition, CreateMarketplaceItemRequest } from '@/types'
import { uploadApi } from '@/api'

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


export default function MarketplaceFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()
    const createMutation = useCreateMarketplaceItem()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [category, setCategory] = useState<ItemCategory>('ELECTRONICS')
    const [condition, setCondition] = useState<ItemCondition>('LIKE_NEW')
    const [location, setLocation] = useState('')
    const [contact, setContact] = useState('')
    const [imageUrls, setImageUrls] = useState('')
    const [uploading, setUploading] = useState(false)

    const normalizedUrls = (value: string) =>
        value
            .split(/\n|,/)
            .map((url) => url.trim())
            .filter((url) => url)

    const handleUploadFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        const files = Array.from(fileList)
        setUploading(true)
        try {
            const res = await uploadApi.uploadImages(files)
            const urls = res?.urls || []
            if (!urls.length) {
                showError('上传失败，请重试')
                return
            }
            const merged = Array.from(new Set([...normalizedUrls(imageUrls), ...urls]))
            setImageUrls(merged.join('\n'))
            showSuccess(`已上传 ${urls.length} 张图片`)
        } catch {
            showError('上传失败，请稍后再试')
        } finally {
            setUploading(false)
        }
    }

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

        if (!contact.trim()) {
            showError('请输入联系方式')
            return
        }

        const images = normalizedUrls(imageUrls)

        if (images.length === 0) {
            showError('请至少上传一张图片（填写图片 URL）')
            return
        }

        const payload: CreateMarketplaceItemRequest = {
            title: title.trim(),
            description: description.trim(),
            price: priceNumber,
            category,
            condition,
            images,
            location: location || undefined,
            contact: contact.trim(),
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

                <div className="grid gap-4 md:grid-cols-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">联系方式 *</label>
                    <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：微信：xxx 或 QQ：xxx"
                        required
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
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
                        <div>
                            <p className="font-medium">本地上传</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">选择图片自动上传并填充 URL</p>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-300 dark:ring-blue-900/60">
                            选择文件
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    void handleUploadFiles(e.target.files)
                                    e.target.value = ''
                                }}
                            />
                        </label>
                        {uploading && <span className="text-xs text-blue-600">正在上传...</span>}
                        {!uploading && normalizedUrls(imageUrls).length > 0 && (
                            <span className="text-xs text-gray-500">
                                已添加 {normalizedUrls(imageUrls).length} 张图片
                            </span>
                        )}
                    </div>
                </div>

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
