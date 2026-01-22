"use client"

import { secondhandApi } from "@/api"
import { Avatar, Button, Card, EmptyState, LoadingState } from "@/components"
import { useAuthStore } from "@/store/useAuthStore"
import { formatNumber, formatTime } from "@/utils/format"
import { useToast } from "@/utils/toast-hook"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Chat, Edit3, Trash2 } from "lucide-react"
import { useState } from "react"

const CONDITION_LABELS: Record<string, string> = {
  new: "全新",
  like_new: "九成新",
  good: "八成新",
  fair: "七成新及以下",
}

const STATUS_LABELS: Record<string, string> = {
  available: "在售",
  sold: "已售出",
  reserved: "已预定",
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500 line-through",
  reserved: "bg-yellow-100 text-yellow-700",
}

export default function SecondhandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["secondhand", id],
    queryFn: () => secondhandApi.findOne(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => secondhandApi.remove(itemId),
    onSuccess: () => {
      showSuccess("商品已删除")
      navigate("/marketplace")
    },
    onError: () => {
      showError("删除失败")
    },
  })

  if (isLoading) {
    return <LoadingState message="加载商品详情..." />
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          type="not-found"
          title="商品不存在"
          description="该商品可能已被删除"
          action={{
            label: "返回二手市场",
            onClick: () => navigate("/marketplace"),
          }}
        />
      </div>
    )
  }

  const isAuthor = currentUser && item.authorId === currentUser.id
  const isAvailable = item.status === "available"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回二手市场
          </button>
        </div>
      </div>

      {/* 商品详情 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：商品图片 */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden p-6">
              {item.images && item.images.length > 0 ? (
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                  暂无图片
                </div>
              )}

              {/* 多图展示 */}
              {item.images && item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.images.slice(1, 5).map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`${item.title} - 图片${index + 2}`}
                        loading="lazy"
                        className="h-full w-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 右侧：商品信息 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card className="p-6">
              <div className="mb-4">
                <div className="mb-2 flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                  {isAuthor && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/marketplace/${item.id}/edit`)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    {CONDITION_LABELS[item.condition]}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-red-600">
                    ¥{formatNumber(item.price)}
                  </p>
                </div>
              </div>

              {/* 商品描述 */}
              <div className="border-t border-gray-200 pt-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">商品描述</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 分类和位置 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">分类</span>
                  <span className="font-medium text-gray-900">{item.category}</span>
                </div>
                {item.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">位置</span>
                    <span className="font-medium text-gray-900">{item.location}</span>
                  </div>
                )}
              </div>

              {/* 发布者信息 */}
              {item.author && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={item.author.avatar}
                      alt={item.author.nickname || item.author.username}
                      username={item.author.username}
                      seed={item.author.id}
                      size={48}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.author.nickname || item.author.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        发布于 {formatTime(item.createdAt)}
                      </p>
                    </div>
                    {isAuthenticated && item.authorId !== currentUser?.id && (
                      <Link
                        to={`/messages/new?userId=${item.author.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Chat className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* 联系信息 */}
            {isAvailable && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">联系信息</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">联系方式</span>
                    <span className="font-medium text-gray-900">{item.contactInfo}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">确认删除</h2>
            <p className="text-gray-600 mb-6">确定要删除这个商品吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
