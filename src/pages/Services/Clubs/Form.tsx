'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { clubsApi } from '@/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { ClubType, CreateRecruitmentRequest } from '@/types'

const CLUB_TYPES: { value: ClubType; label: string }[] = [
    { value: 'ACADEMIC', label: '学术科研' },
    { value: 'SPORTS', label: '体育运动' },
    { value: 'ARTS', label: '文艺表演' },
    { value: 'TECHNOLOGY', label: '科技创新' },
    { value: 'VOLUNTEER', label: '志愿公益' },
    { value: 'ENTREPRENEURSHIP', label: '创业实践' },
    { value: 'CULTURE', label: '文化交流' },
    { value: 'OTHER', label: '其他' },
]

export default function ClubRecruitmentFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()

    const [clubName, setClubName] = useState('')
    const [clubType, setClubType] = useState<ClubType>('ACADEMIC')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [requirements, setRequirements] = useState('')
    const [benefits, setBenefits] = useState('')
    const [positions, setPositions] = useState('')
    const [recruitCount, setRecruitCount] = useState('')
    const [deadline, setDeadline] = useState('')
    const [contactName, setContactName] = useState('')
    const [phone, setPhone] = useState('')
    const [wechat, setWechat] = useState('')
    const [qq, setQq] = useState('')
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!user) {
        navigate('/login')
        return <LoadingState message="正在跳转到登录页..." />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!clubName.trim()) {
            showError('请输入社团名称')
            return
        }

        if (!title.trim()) {
            showError('请输入招新标题')
            return
        }

        if (!contactName.trim()) {
            showError('请输入联系人姓名')
            return
        }

        const positionsArray = positions
            .split(',')
            .map((p) => p.trim())
            .filter((p) => p)

        if (positionsArray.length === 0) {
            showError('请至少填写一个招新岗位')
            return
        }

        const payload: CreateRecruitmentRequest = {
            clubName: clubName.trim(),
            clubType,
            title: title.trim(),
            description: description.trim(),
            requirements: requirements.trim() || undefined,
            benefits: benefits.trim() || undefined,
            positions: positionsArray,
            recruitCount: recruitCount ? Number(recruitCount) || undefined : undefined,
            deadline: deadline || undefined,
            contactInfo: {
                name: contactName.trim(),
                phone: phone.trim() || undefined,
                wechat: wechat.trim() || undefined,
                qq: qq.trim() || undefined,
                email: email.trim() || undefined,
            },
        }

        try {
            setIsSubmitting(true)
            await clubsApi.createRecruitment(payload)
            showSuccess('招新信息已发布')
            navigate('/clubs')
        } catch {
            showError('发布失败，请稍后重试')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">发布社团招新</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">社团名称</label>
                    <input
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：学生会宣传部"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">社团类型</label>
                        <select
                            value={clubType}
                            onChange={(e) => setClubType(e.target.value as ClubType)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {CLUB_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">招新标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：XX 社团 2025 春季招新"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">招新简介</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={4}
                        placeholder="介绍一下社团和本次招新的基本情况"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">招新要求（可选）</label>
                        <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">加入收获（可选）</label>
                        <textarea
                            value={benefits}
                            onChange={(e) => setBenefits(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">招新岗位（用逗号分隔）</label>
                        <input
                            value={positions}
                            onChange={(e) => setPositions(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="例如：宣传、外联、文案"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">计划人数（可选）</label>
                        <input
                            type="number"
                            value={recruitCount}
                            onChange={(e) => setRecruitCount(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            min={0}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">截止日期（可选）</label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">联系人姓名</label>
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

                <div className="grid gap-4 md:grid-cols-3">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">邮箱（可选）</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? '发布中...' : '发布招新信息'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
