"use client"

import { studyResourcesApi, type StudyResource } from "@/api"
import { Button, Card, EmptyState, LoadingState } from "@/components"
import { useAuthStore } from "@/store/useAuthStore"
import { formatTime } from "@/utils/format"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, Edit, Trash2, FileText, User, Clock, Download as DownloadIcon } from "lucide-react"
import { useToast } from "@/utils/toast-hook"

const TYPE_LABELS: Record<string, string> = {
  note: "课堂笔记",
  exam: "考试资料",
  material: "学习材料",
  other: "其他",
}

const CATEGORY_LABELS: Record<string, string> = {
  computer: "计算机",
  math: "数学",
  english: "英语",
  physics: "物理",
  chemistry: "化学",
  other: "其他",
}

export default function StudyResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["study-resource", id],
    queryFn: () => studyResourcesApi.findOne(id!),
    enabled: !!id,
  })

  const resource = data

  // 删除学习资源
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyResourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-resources"] })
      showSuccess("资源已删除")
      navigate("/study-resources")
    },
    onError: () => {
      showError("删除失败")
    },
  })

  const handleDownload = async () => {
    if (!resource) return
    try {
      await studyResourcesApi.download(resource.id)
      queryClient.invalidateQueries({ queryKey: ["study-resource", id] })
      window.open(resource.fileUrl, "_blank")
    } catch {
      showError("下载失败，请重试")
    }
  }

  const handleDelete = () => {
    if (!id) return
    if (window.confirm("确定要删除这个学习资源吗？")) {
      deleteMutation.mutate(id)
    }
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState type="error" title="无效的资源ID" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="加载中..." />
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          type="error"
          title="资源不存在"
          description="该学习资源可能已被删除"
          action={{
            label: "返回列表",
            onClick: () => navigate("/study-resources"),
          }}
        />
      </div>
    )
  }

  const isAuthor = user?.id === resource.authorId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/study-resources")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回学习资源
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="p-8">
          {/* 标题和操作按钮 */}
          <div className="mb-6 flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
            {isAuthor && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/study-resources/${id}/edit`)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  删除
                </Button>
              </div>
            )}
          </div>

          {/* 作者信息 */}
          <div className="mb-6 flex items-center gap-3 pb-6 border-b border-gray-200">
            <Link to={`/users/${resource.authorId}`}>
              <img
                src={resource.author.avatar || "/default-avatar.png"}
                alt={resource.author.username}
                className="h-10 w-10 rounded-full"
              />
            </Link>
            <div className="flex-1">
              <Link
                to={`/users/${resource.authorId}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {resource.author.username}
              </Link>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(resource.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* 缩略图 */}
          {resource.thumbnail && (
            <div className="mb-6">
              <img
                src={resource.thumbnail}
                alt={resource.title}
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* 描述 */}
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">资源描述</h2>
            <p className="whitespace-pre-wrap text-gray-700">{resource.description}</p>
          </div>

          {/* 资源信息 */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <span className="text-sm text-gray-500">分类</span>
              <p className="font-medium text-gray-900">
                {CATEGORY_LABELS[resource.category] || resource.category}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">类型</span>
              <p className="font-medium text-gray-900">
                {TYPE_LABELS[resource.type] || resource.type}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">文件名</span>
              <p className="font-medium text-gray-900">{resource.fileName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">文件大小</span>
              <p className="font-medium text-gray-900">
                {resource.fileSize
                  ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : "未知"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">下载次数</span>
              <p className="font-medium text-gray-900">{resource.downloadCount}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">上传时间</span>
              <p className="font-medium text-gray-900">{formatTime(resource.createdAt)}</p>
            </div>
          </div>

          {/* 标签 */}
          {resource.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">标签</h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <Button size="lg" variant="primary" onClick={handleDownload}>
              <DownloadIcon className="mr-2 h-5 w-5" />
              下载资源
            </Button>
          </div>
        </Card>

        {/* 作者其他资源 */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">作者上传的其他资源</h2>
          <Card className="p-6 text-center text-gray-500">
            暂无其他资源
          </Card>
        </div>
      </div>
    </div>
  )
}
