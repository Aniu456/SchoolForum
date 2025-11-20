'use client'

import { Link, useParams } from 'react-router-dom'
import { LoadingState, EmptyState, Button, Avatar } from '@/components'
import { useResource, useDownloadResource } from '@/hooks/useResources'
import { formatNumber, formatTime, formatFileSize } from '@/utils/format'
import type { ResourceType, SubjectCategory } from '@/types'

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
    COURSE_NOTES: '课程笔记',
    EXAM_MATERIALS: '考试资料',
    TEXTBOOK: '教材电子版',
    VIDEO: '视频教程',
    SOFTWARE: '软件工具',
    TEMPLATE: '模板文档',
    OTHER: '其他',
}

const SUBJECT_LABELS: Partial<Record<SubjectCategory, string>> = {
    COMPUTER_SCIENCE: '计算机',
    MATHEMATICS: '数学',
    PHYSICS: '物理',
    CHEMISTRY: '化学',
    BIOLOGY: '生物',
    LITERATURE: '文学',
    HISTORY: '历史',
    ECONOMICS: '经济',
    MANAGEMENT: '管理',
    ENGINEERING: '工程',
    ARTS: '艺术',
    LANGUAGE: '语言',
    OTHER: '其他',
}

export default function ResourceDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { data: resource, isLoading, error, refetch } = useResource(id || '')
    const downloadMutation = useDownloadResource()

    if (!id) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState type="not-found" title="资源不存在" description="缺少资源 ID" showHomeButton />
            </div>
        )
    }

    if (isLoading) {
        return <LoadingState message="加载资源中..." />
    }

    if (error || !resource) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <EmptyState
                    type="error"
                    title="加载失败"
                    description="无法加载资源详情，请稍后重试"
                    action={{ label: '重新加载', onClick: () => refetch() }}
                    showHomeButton
                />
            </div>
        )
    }

    const typeLabel = RESOURCE_TYPE_LABELS[resource.type]
    const subjectLabel = SUBJECT_LABELS[resource.subject] ?? resource.subject

    const handleDownload = () => {
        if (!resource.id) return
        downloadMutation.mutate(resource.id)
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <header className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{resource.title}</h1>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {typeLabel}
                        </span>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            {subjectLabel}
                        </span>
                        {resource.tags?.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </header>

                {resource.coverImage && (
                    <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <img src={resource.coverImage} alt={resource.title} className="h-64 w-full object-cover" />
                    </div>
                )}

                <p className="mb-4 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{resource.description}</p>

                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>📥 {formatNumber(resource.downloadCount)} 次下载</span>
                    <span>👁️ {formatNumber(resource.viewCount)} 次浏览</span>
                    <span>👍 {formatNumber(resource.likeCount)} 次点赞</span>
                    <span>发布时间 {formatTime(resource.createdAt)}</span>
                </div>

                {resource.fileSize !== undefined && (
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        文件大小：{formatFileSize(resource.fileSize)}
                    </div>
                )}

                {resource.author && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                        <Avatar
                            src={resource.author.avatar}
                            alt={resource.author.username}
                            username={resource.author.username}
                            size={40}
                            seed={resource.author.id}
                        />
                        <div className="flex-1">
                            <Link
                                to={`/users/${resource.author.id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                                {resource.author.nickname || resource.author.username}
                            </Link>
                            <div className="text-xs text-gray-500 dark:text-gray-400">分享者</div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                    {resource.fileUrl && (
                        <Button variant="primary" onClick={handleDownload} disabled={downloadMutation.isPending}>
                            {downloadMutation.isPending ? '下载中...' : '下载资源'}
                        </Button>
                    )}
                    {resource.externalUrl && (
                        <a
                            href={resource.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            打开外部链接
                        </a>
                    )}
                    <Button variant="outline" onClick={() => window.history.back()}>
                        返回
                    </Button>
                </div>
            </article>
        </div>
    )
}
