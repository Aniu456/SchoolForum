'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { carpoolApi } from '@/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { CarpoolType, CreateCarpoolRequest } from '@/types'

const CARPOOL_TYPES: { value: CarpoolType; label: string }[] = [
    { value: 'CARPOOL', label: '拼车' },
    { value: 'FOOD_ORDER', label: '拼外卖' },
    { value: 'SHOPPING', label: '拼购物' },
    { value: 'TICKET', label: '拼票' },
    { value: 'OTHER', label: '其他' },
]

export default function CarpoolFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()

    const [type, setType] = useState<CarpoolType>('CARPOOL')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [departureLocation, setDepartureLocation] = useState('')
    const [arrivalLocation, setArrivalLocation] = useState('')
    const [departureTime, setDepartureTime] = useState('')
    const [totalSeats, setTotalSeats] = useState('')
    const [pricePerPerson, setPricePerPerson] = useState('')
    const [deadline, setDeadline] = useState('')
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

        if (type === 'CARPOOL') {
            if (!departureLocation.trim() || !arrivalLocation.trim()) {
                showError('请填写出发和到达地点')
                return
            }
            if (!departureTime) {
                showError('请填写出发时间')
                return
            }
        }

        const payload: CreateCarpoolRequest = {
            type,
            title: title.trim(),
            description: description.trim(),
            departureLocation: departureLocation.trim() || undefined,
            arrivalLocation: arrivalLocation.trim() || undefined,
            departureTime: departureTime ? new Date(departureTime).toISOString() : undefined,
            totalSeats: totalSeats ? Number(totalSeats) || undefined : undefined,
            pricePerPerson: pricePerPerson ? Number(pricePerPerson) || undefined : undefined,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
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
            await carpoolApi.createCarpoolItem(payload)
            showSuccess('拼单已发布')
            navigate('/carpool')
        } catch {
            showError('发布失败，请稍后重试')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">发起拼车/拼单</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">类型</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as CarpoolType)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                        {CARPOOL_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：周五晚 18:00 东门 → 火车站 拼车"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={4}
                        placeholder="详细说明行程/拼单内容、费用分摊规则等"
                    />
                </div>

                {type === 'CARPOOL' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">出发地点</label>
                            <input
                                value={departureLocation}
                                onChange={(e) => setDepartureLocation(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">到达地点</label>
                            <input
                                value={arrivalLocation}
                                onChange={(e) => setArrivalLocation(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">出发时间（可选）</label>
                        <input
                            type="datetime-local"
                            value={departureTime}
                            onChange={(e) => setDepartureTime(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">总人数（可选）</label>
                        <input
                            type="number"
                            value={totalSeats}
                            onChange={(e) => setTotalSeats(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">人均费用（可选，¥）</label>
                        <input
                            type="number"
                            value={pricePerPerson}
                            onChange={(e) => setPricePerPerson(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            min={0}
                            step={0.01}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">报名截止时间（可选）</label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
                        {isSubmitting ? '发布中...' : '发布拼单'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
