"use client"

import { draftApi } from "@/api"
import { Button, Card, EmptyState, LoadingState } from "@/components"
import { useAuthStore } from "@/store/useAuthStore"
import { formatTime } from "@/utils/format"
import { useToast } from "@/utils/toast-hook"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit3, FileText, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export default function DraftsListPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  // 获取本地草稿
  const getLocalDrafts = () => {
    if (typeof window === "undefined") return []
    const drafts = localStorage.getItem("post_drafts")
    return drafts ? JSON.parse(drafts) : []
  }

  // 获取远程草稿
  const { data, isLoading, error } = useQuery({
    queryKey: ["drafts"],
    queryFn: () => draftApi.getDrafts(1, 20),
    enabled: isAuthenticated,
  })

  // 合并本地和远程草稿
  const remoteDrafts = data?.data || []
  const localDrafts = getLocalDrafts()
  const allDrafts = [
    ...localDrafts.map((draft: any) => ({ ...draft, id: `local_${draft.id}`, isLocal: true })),
    ...remoteDrafts.map((draft: any) => ({ ...draft, isLocal: false })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const drafts = allDrafts

  // 删除草稿
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("local_")) {
        // 删除本地草稿
        const localId = id.replace("local_", "")
        const drafts = getLocalDrafts()
        const filteredDrafts = drafts.filter((d: any) => d.id !== localId)
        localStorage.setItem("post_drafts", JSON.stringify(filteredDrafts))
        return { message: "删除成功" }
      } else {
        // 删除远程草稿
        return draftApi.deleteDraft(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      showSuccess("草稿已删除")
    },
    onError: () => {
      showError("删除失败")
    },
  })

  // 发布草稿
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("local_")) {
        // 本地草稿需要先同步到服务器
        const localId = id.replace("local_", "")
        const drafts = getLocalDrafts()
        const draft = drafts.find((d: any) => d.id === localId)
        if (!draft) throw new Error("草稿不存在")
        return draftApi.createOrUpdateDraft(draft)
      } else {
        // 发布远程草稿
        return draftApi.publishDraft(id)
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      showSuccess(`发布成功！帖子ID: ${data.postId}`)
      navigate(`/posts/${data.postId}`)
    },
    onError: () => {
      showError("发布失败")
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除这个草稿吗？")) {
      deleteMutation.mutate(id)
    }
  }

  const handlePublish = (id: string) => {
    publishMutation.mutate(id)
  }

  const handleEdit = (id: string) => {
    if (id.startsWith("local_")) {
      // 编辑本地草稿
      const localId = id.replace("local_", "")
      navigate(`/posts/new?localDraft=${localId}`)
    } else {
      // 编辑远程草稿
      navigate(`/posts/new?draft=${id}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          type="error"
          title="请先登录"
          description="登录后可以查看和管理您的草稿"
          action={{
            label: "去登录",
            onClick: () => navigate("/login"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">我的草稿</h1>
              <p className="mt-1 text-sm text-gray-500">
                {drafts.length} 个草稿
                {drafts.some((d) => d.id.startsWith("local_")) && "（含本地草稿）"}
              </p>
            </div>
            <Link to="/posts/new">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                写新帖子
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 草稿列表 */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState message="加载草稿中..." />
        ) : error ? (
          <EmptyState
            type="error"
            title="加载失败"
            description="请稍后重试"
            action={{
              label: "重新加载",
              onClick: () => window.location.reload(),
            }}
          />
        ) : drafts.length === 0 ? (
          <EmptyState
            type="empty"
            title="暂无草稿"
            description="开始写帖子时会自动保存草稿"
            action={{
              label: "去写帖子",
              onClick: () => navigate("/posts/new"),
            }}
          />
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => {
              const isLocal = draft.id.startsWith("local_")
              const preview = draft.content?.substring(0, 100).replace(/<[^>]*>/g, "") || "无内容"
              const title = draft.title || "无标题"

              return (
                <Card key={draft.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{title}</h3>
                        {isLocal && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">本地</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{preview}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span>{draft.tags?.join(", ") || "无标签"}</span>
                        <span>•</span>
                        <span>{formatTime(draft.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(draft.id)}>
                        <Edit3 className="mr-2 h-3 w-3" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePublish(draft.id)}
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? "发布中..." : "发布"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(draft.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        删除
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
