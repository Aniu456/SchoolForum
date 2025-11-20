'use client'

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clubsApi } from '@/api'
import { LoadingState, EmptyState, Button } from '@/components'
import type { ClubRecruitment } from '@/types'
import { formatTime, formatNumber } from '@/utils/format'
import { useToast } from '@/utils/toast-hook'
import { useAuthStore } from '@/store/useAuthStore'

export default function ClubRecruitmentDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { showSuccess, showError } = useToast()
    const { user } = useAuthStore()
    const [applyMessage, setApplyMessage] = useState('')

    const {
        data: recruitment,
        isLoading,
        error,
        refetch,
    } = useQuery<ClubRecruitment | undefined>({
        queryKey: ['clubs', 'recruitment', id],
        queryFn: async () => {
            if (!id) return undefined
            return clubsApi.getRecruitment(id)
        },
        enabled: !!id,
    })

    if (!id) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState type="not-found" title="招新信息不存在" description="缺少招新 ID" showHomeButton />
            </div>
        )
    }

    if (isLoading) {
        return <LoadingState message="加载招新信息中..." />
    }

    if (error || !recruitment) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState
                    type="error"
                    title="加载失败"
                    description="无法加载招新详情，请稍后重试"
                    action={{ label: '重新加载', onClick: () => refetch() }}
                    showHomeButton
                />
            </div>
        )
    }

    const handleApply = async () => {
        if (!user) {
            showError('请先登录后再申请加入社团')
            return
        }

        try {
            await clubsApi.applyToClub(recruitment.id, applyMessage || undefined)
            showSuccess('申请已提交，等待社团负责人联系你')
            setApplyMessage('')
        } catch {
            showError('申请失败，请稍后重试')
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <header className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-800">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{recruitment.title}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recruitment.club?.name} · 发布于 {formatTime(recruitment.createdAt)}
                    </p>
                </header>

                <section className="mb-4 space-y-3 text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-wrap">{recruitment.description}</p>
                    {recruitment.requirements && (
                        <div>
                            <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">招新要求</h2>
                            <p className="whitespace-pre-wrap text-sm">{recruitment.requirements}</p>
                        </div>
                    )}
                    {recruitment.benefits && (
                        <div>
                            <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">加入收获</h2>
                            <p className="whitespace-pre-wrap text-sm">{recruitment.benefits}</p>
                        </div>
                    )}
                </section>

                <section className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="mb-2">
                        <span className="font-semibold">招募岗位：</span>
                        {recruitment.positions.join('、')}
                    </div>
                    {recruitment.recruitCount && (
                        <div className="mb-1">计划招募人数：{recruitment.recruitCount} 人</div>
                    )}
                    {recruitment.deadline && (
                        <div className="mb-1">截止日期：{formatTime(recruitment.deadline)}</div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400">
                        <span>👁️ {formatNumber(recruitment.viewCount)} 次浏览</span>
                        <span>📝 {formatNumber(recruitment.applicationCount)} 人申请</span>
                    </div>
                </section>

                <section className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                    <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">联系方式</h2>
                    <p>联系人：{recruitment.contactInfo.name}</p>
                    {recruitment.contactInfo.phone && <p>电话：{recruitment.contactInfo.phone}</p>}
                    {recruitment.contactInfo.wechat && <p>微信：{recruitment.contactInfo.wechat}</p>}
                    {recruitment.contactInfo.qq && <p>QQ：{recruitment.contactInfo.qq}</p>}
                    {recruitment.contactInfo.email && <p>邮箱：{recruitment.contactInfo.email}</p>}
                </section>

                <section className="space-y-3">
                    <textarea
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={3}
                        placeholder="简单介绍一下自己和想加入社团的原因（可选）"
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            返回
                        </Button>
                        <Button variant="primary" onClick={handleApply}>
                            申请加入社团
                        </Button>
                    </div>
                </section>
            </article>
        </div>
    )
}
