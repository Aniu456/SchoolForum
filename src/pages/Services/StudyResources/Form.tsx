'use client'

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, LoadingState } from '@/components'
import { studyResourceApi } from '@/api'
import type { CreateResourceRequest, ResourceType, StudyResource } from '@/api/services/studyResource'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/utils/toast-hook'

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
    { value: 'DOCUMENT', label: '文档' },
    { value: 'VIDEO', label: '视频' },
    { value: 'LINK', label: '链接' },
    { value: 'CODE', label: '代码' },
    { value: 'OTHER', label: '其他' },
]

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
    { value: '算法', label: '算法' },
    { value: '前端', label: '前端' },
    { value: '后端', label: '后端' },
    { value: '数据库', label: '数据库' },
    { value: 'AI', label: 'AI' },
    { value: '考研', label: '考研' },
]

const normalizeTags = (value: string) =>
    value
        .split(/[\s,\n]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)

export default function StudyResourceFormPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEdit = Boolean(id)
    const { user } = useAuthStore()
    const { showSuccess, showError } = useToast()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('算法')
    const [type, setType] = useState<ResourceType>('DOCUMENT')
    const [fileUrl, setFileUrl] = useState('')
    const [link, setLink] = useState('')
    const [tagsInput, setTagsInput] = useState('')

    const { data: initialData, isLoading: loadingDetail } = useQuery<StudyResource | undefined>({
        queryKey: ['study-resource', id, 'edit'],
        queryFn: () => (id ? studyResourceApi.getDetail(id) : Promise.resolve(undefined)),
        enabled: Boolean(id),
    })

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '')
            setDescription(initialData.description || '')
            setCategory(initialData.category || '算法')
            setType(initialData.type as ResourceType)
            setFileUrl(initialData.fileUrl || '')
            setLink(initialData.link || '')
            setTagsInput((initialData.tags || []).join(' '))
        }
    }, [initialData])

    if (!user) {
        navigate('/login')
        return <LoadingState message="正在跳转到登录页..." />
    }

    if (isEdit && loadingDetail) {
        return <LoadingState message="加载资源信息中..." />
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

        const trimmedFileUrl = fileUrl.trim()
        const trimmedLink = link.trim()

        if (!trimmedFileUrl && !trimmedLink) {
            showError('请至少填写文件地址或外部链接')
            return
        }

        const tags = normalizeTags(tagsInput)

        const payload: CreateResourceRequest = {
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || '其他',
            type,
            fileUrl: trimmedFileUrl || undefined,
            link: trimmedLink || undefined,
            tags: tags.length ? tags : undefined,
        }

        try {
            if (isEdit && id) {
                await studyResourceApi.update(id, payload)
                showSuccess('资源更新成功')
                navigate(`/study-resources/${id}`)
            } else {
                const created = await studyResourceApi.create(payload)
                const createdId = (created as StudyResource).id
                showSuccess('资源发布成功')
                navigate(`/study-resources/${createdId}`)
            }
        } catch (error) {
            console.error('保存学习资源失败:', error)
            showError('保存失败，请稍后重试')
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isEdit ? '编辑学习资源' : '发布学习资源'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="例如：线性代数期末复习笔记"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={5}
                        placeholder="简单介绍一下资源内容、适用场景等"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            <option value="">请选择分类</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">资源类型</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as ResourceType)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {RESOURCE_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文件地址 (可选)</label>
                        <input
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="例如：http://.../resource.pdf"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">外部链接 (可选)</label>
                        <input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="例如：网盘链接或在线文档链接"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标签 (可选)</label>
                    <textarea
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        rows={2}
                        placeholder="例如：期末 考研 线代，每个标签用空格或逗号分隔"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary">
                        {isEdit ? '保存修改' : '发布资源'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
