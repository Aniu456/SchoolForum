'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { lostfoundApi } from '@/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { LostFoundType, LostFoundCategory, CreateLostFoundRequest } from '@/types'

const TYPES: { value: LostFoundType; label: string }[] = [
    { value: 'LOST', label: '我丢失了（寻物）' },
    { value: 'FOUND', label: '我捡到了（招领）' },
]

const CATEGORIES: { value: LostFoundCategory; label: string }[] = [
    { value: 'ELECTRONICS', label: '电子产品' },
    { value: 'DOCUMENTS', label: '证件文件' },
    { value: 'KEYS', label: '钥匙' },
    { value: 'CARDS', label: '卡类' },
    { value: 'BAGS', label: '包类' },
    { value: 'CLOTHING', label: '衣物' },
    { value: 'BOOKS', label: '书籍' },
    { value: 'ACCESSORIES', label: '配饰' },
    { value: 'OTHER', label: '其他' },
]

export default function LostFoundFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()

    const [type, setType] = useState<LostFoundType>('LOST')
    const [category, setCategory] = useState<LostFoundCategory>('OTHER')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [date, setDate] = useState('')
    const [imageUrls, setImageUrls] = useState('')
    const [contactName, setContactName] = useState('')
    const [phone, setPhone] = useState('')
    const [wechat, setWechat] = useState('')
    const [qq, setQq] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

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

        if (!location.trim()) {
            showError('请输入丢失/捡到地点')
            return
        }

        if (!date) {
            showError('请选择时间')
            return
        }

        const images = imageUrls
            .split(/\n|,/)
            .map((url) => url.trim())
            .filter((url) => url)

        const payload: CreateLostFoundRequest = {
            type,
            category,
            title: title.trim(),
            description: description.trim(),
            images: images.length ? images : undefined,
            location: location.trim(),
            lostOrFoundDate: new Date(date).toISOString(),
            contactInfo: {
                name: contactName.trim() || undefined,
                phone: phone.trim() || undefined,
                wechat: wechat.trim() || undefined,
                qq: qq.trim() || undefined,
            },
            isAnonymous: false,
        }

        try {
            setIsSubmitting(true)
            await lostfoundApi.createLostFoundItem(payload)
            showSuccess('信息已发布')
            navigate('/lostfound')
        } catch {
            showError('发布失败，请稍后重试')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">发布失物招领信息</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">类型</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LostFoundType)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：在图书馆丢失一张校园卡"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={4}
                        placeholder="详细描述物品特征、丢失/捡到经过等"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">地点</label>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="例如：图书馆一楼、自习室等"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">时间</label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">图片 URL（每行一条或用逗号分隔，可选）</label>
                    <textarea
                        value={imageUrls}
                        onChange={(e) => setImageUrls(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={3}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">联系人姓名（可选）</label>
                        <input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">联系电话（可选）</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">微信（可选）</label>
                        <input
                            value={wechat}
                            onChange={(e) => setWechat(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QQ（可选）</label>
                        <input
                            value={qq}
                            onChange={(e) => setQq(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? '发布中...' : '发布信息'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
