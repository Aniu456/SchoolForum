"use client"

import { postApi } from "@/api"
import { Button, Card, EmptyState, LoadingState } from "@/components"
import { formatTime } from "@/utils/format"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Tag as TagIcon, BookOpen } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { keepPreviousData } from "@tanstack/react-query"

export default function StudyResourcesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ["study-resources", page],
    queryFn: async () => {
      return postApi.getPosts({
        page,
        limit: PAGE_SIZE,
        tag: "学习资源",
        sortBy: "createdAt",
        order: "desc",
      })
    },
    placeholderData: keepPreviousData,
  })

  const posts = data?.data || []
  const meta = data?.meta
  const totalPages = meta?.totalPages || 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </button>
              <h1 className="text-2xl font-bold text-gray-900">学习资源</h1>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/posts/new?tags=学习资源")}
            >
              上传资源
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            分享学习资料，共同进步
          </p>
        </div>
      </div>

      {/* 资源列表 */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState message="加载中..." />
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
        ) : posts.length === 0 ? (
          <EmptyState
            type="empty"
            title="暂无学习资源"
            description="快来分享你的学习资料吧"
            action={{
              label: "上传资源",
              onClick: () => navigate("/posts/new?tags=学习资源"),
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="block">
                  <Card className="h-full overflow-hidden p-0 transition-shadow hover:shadow-lg">
                    {post.images && post.images.length > 0 && (
                      <div className="aspect-video w-full overflow-hidden bg-gray-100">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="flex-1 font-semibold text-gray-900 line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {post.content.replace(/<[^>]*>/g, "").substring(0, 100)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          学习资源
                        </span>
                        {post.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            <TagIcon className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span>{post.author?.username}</span>
                        <span>{formatTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}