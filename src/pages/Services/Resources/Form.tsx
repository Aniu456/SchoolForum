'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingState } from '@/components'
import { useCreateResource } from '@/hooks/useResources'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'
import type { CreateResourceRequest, ResourceType, SubjectCategory } from '@/types'

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
    { value: 'COURSE_NOTES', label: '课程笔记' },
    { value: 'EXAM_MATERIALS', label: '考试资料' },
    { value: 'TEXTBOOK', label: '教材电子版' },
    { value: 'VIDEO', label: '视频教程' },
    { value: 'SOFTWARE', label: '软件工具' },
    { value: 'TEMPLATE', label: '模板文档' },
    { value: 'OTHER', label: '其他' },
]

const SUBJECTS: { value: SubjectCategory; label: string }[] = [
    { value: 'COMPUTER_SCIENCE', label: '计算机' },
    { value: 'MATHEMATICS', label: '数学' },
    { value: 'PHYSICS', label: '物理' },
    { value: 'CHEMISTRY', label: '化学' },
    { value: 'BIOLOGY', label: '生物' },
    { value: 'LITERATURE', label: '文学' },
    { value: 'HISTORY', label: '历史' },
    { value: 'ECONOMICS', label: '经济' },
    { value: 'MANAGEMENT', label: '管理' },
    { value: 'ENGINEERING', label: '工程' },
    { value: 'ARTS', label: '艺术' },
    { value: 'LANGUAGE', label: '语言' },
    { value: 'OTHER', label: '其他' },
]

export default function ResourceFormPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()
    const createMutation = useCreateResource()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<ResourceType>('COURSE_NOTES')
    const [subject, setSubject] = useState<SubjectCategory>('COMPUTER_SCIENCE')
    const [tags, setTags] = useState('')
    const [fileUrl, setFileUrl] = useState('')
    const [externalUrl, setExternalUrl] = useState('')
    const [coverImage, setCoverImage] = useState('')
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
            showError('请输入资源描述')
            return
        }

        if (!fileUrl.trim() && !externalUrl.trim()) {
            showError('请至少提供文件链接或外部链接')
            return
        }

        const tagsArray = tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag)

        const payload: CreateResourceRequest = {
            title: title.trim(),
            description: description.trim(),
            type,
            subject,
            tags: tagsArray.length ? tagsArray : undefined,
            fileUrl: fileUrl.trim() || undefined,
            externalUrl: externalUrl.trim() || undefined,
            coverImage: coverImage.trim() || undefined,
            isAnonymous,
        }

        try {
            await createMutation.mutateAsync(payload)
            showSuccess('资源发布成功')
            navigate('/resources')
        } catch {
            showError('发布失败，请稍后重试')
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">分享学习资源</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：高等数学期末复习资料"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={5}
                        placeholder="简单介绍资源内容、适用课程等"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">资源类型</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as ResourceType)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {RESOURCE_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">学科</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {SUBJECTS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标签（用逗号分隔，可选）</label>
                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：期末, 数学, 复习资料"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文件链接（可选）</label>
                        <input
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="上传到网盘的下载链接等"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">外部链接（可选）</label>
                        <input
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="例如：B 站视频链接等"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">封面图片 URL（可选）</label>
                    <input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>匿名分享（对其他用户隐藏个人信息）</span>
                </label>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                        {createMutation.isPending ? '发布中...' : '发布资源'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
