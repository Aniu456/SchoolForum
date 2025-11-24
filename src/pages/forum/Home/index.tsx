"use client"

import { postApi, recommendationApi, searchApi } from "@/api"
import { Announcement, announcementApi, AnnouncementPriority } from "@/api/content/announcement"
import { Avatar, Button, EmptyState, LoadingState } from "@/components"
import { useAuthStore } from "@/store/useAuthStore"
import { SortType } from "@/types"
import { formatNumber, formatTime } from "@/utils/format"
import { stripHtml } from "@/utils/helpers"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Clock, Eye, Flame, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortType>("latest")
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [pinnedPage, setPinnedPage] = useState(1)
  const PAGE_SIZE = 20
  const PINNED_PAGE_SIZE = 4
  const { user: currentUser } = useAuthStore()
  const listRef = useRef<HTMLDivElement | null>(null)

  // 滚动到帖子列表区域顶部（tabs 下方的位置）
  const scrollToListTop = () => {
    if (!listRef.current) return

    // 获取元素位置
    const rect = listRef.current.getBoundingClientRect()
    const offset = 100 // 预留顶部导航栏高度 + 一些空白
    const scrollTop = window.scrollY + rect.top - offset

    // 平滑滚动到目标位置
    window.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: "smooth",
    })
  }

  // 翻页时回到列表顶部
  useEffect(() => {
    // 只在翻页时滚动，避免初始加载时滚动
    if (page > 1) {
      scrollToListTop()
    }
  }, [page])

  // 获取公告列表
  const { data: announcementsData } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.getAnnouncements({ limit: 5 }),
  })

  const announcements = announcementsData?.data || []

  useEffect(() => {
    if (!announcements.length) return
    const timer = window.setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcements.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [announcements.length])

  // 热门标签（使用后端数据）
  const { data: popularTagsData } = useQuery({
    queryKey: ["popular-tags", 8],
    queryFn: () => searchApi.getPopularTags(8),
  })
  const popularTags = Array.isArray(popularTagsData)
    ? popularTagsData
    : Array.isArray((popularTagsData as any)?.data)
    ? (popularTagsData as any).data
    : []

  // 置顶帖子独立获取，避免随排序切换
  const {
    data: pinnedData,
    isLoading: pinnedLoading,
    error: pinnedError,
  } = useQuery({
    queryKey: ["posts", "pinned"],
    queryFn: async () =>
      postApi.getPosts({
        page: 1,
        limit: 200, // 拉宽范围，避免置顶不在首页时丢失
        sortBy: "createdAt",
        order: "desc",
      }),
    staleTime: 1000 * 60 * 5,
  })
  const pinnedFromFetch = (((pinnedData as any)?.data ?? (pinnedData as any)?.data?.data ?? []) as any[]).filter(
    (post: any) => post.isPinned,
  )

  const {
    data: postsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["posts", "home", sortBy, page, selectedTag],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // map sort to backend endpoints
      if (!selectedTag && sortBy === "trending") {
        return recommendationApi.getTrendingPosts(page, PAGE_SIZE)
      }
      if (!selectedTag && sortBy === "popular") {
        return recommendationApi.getHotPosts(page, PAGE_SIZE)
      }
      const params: any = {
        page,
        limit: PAGE_SIZE,
        sortBy: sortBy === "latest" ? "createdAt" : "viewCount",
      }
      if (selectedTag) params.tag = selectedTag
      return postApi.getPosts(params)
    },
  })

  const normalizeList = (payload: any) => {
    const wrapper =
      payload?.data && Array.isArray(payload.data.data)
        ? payload.data
        : payload?.data && Array.isArray(payload.data)
        ? payload
        : payload
    return {
      list: Array.isArray(wrapper?.data) ? wrapper.data : [],
      meta: wrapper?.meta || wrapper?.pagination,
    }
  }

  const { list: pagePosts, meta } = normalizeList(postsData)
  const totalPages = meta?.totalPages ?? (meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1)

  // 合并置顶数据，确保展示
  const pinnedPosts = useMemo(() => {
    const combined = [...pinnedFromFetch, ...pagePosts.filter((p: any) => p.isPinned)]
    const map = new Map<string, any>()
    combined.forEach((p: any) => {
      if (p?.id && p.isPinned) {
        map.set(p.id, p)
      }
    })
    return Array.from(map.values())
  }, [pinnedFromFetch, pagePosts])

  const totalPinnedPages = Math.max(1, Math.ceil((pinnedPosts.length || 0) / PINNED_PAGE_SIZE))
  const pinnedPagePosts = pinnedPosts.slice((pinnedPage - 1) * PINNED_PAGE_SIZE, pinnedPage * PINNED_PAGE_SIZE)

  // 不展示置顶在列表里
  const normalPosts = pagePosts.filter((post: any) => !post.isPinned)

  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag)
    setPage(1)
    // 切换标签时延迟滚动，等待数据加载
    setTimeout(() => scrollToListTop(), 200)
  }

  const getAuthorName = (post: any) => post?.author?.nickname || post?.author?.username || "匿名用户"
  const getViews = (post: any) => post?.viewCount ?? post?.views ?? 0
  const getLikes = (post: any) => post?.likeCount ?? post?.likes ?? 0
  const getComments = (post: any) => post?.commentCount ?? post?.comments ?? 0
  const getTags = (post: any) => (Array.isArray(post?.tags) ? post.tags : [])
  const getPreview = (post: any) => {
    const text = stripHtml(post?.content || "")
    return text.length > 80 ? `${text.slice(0, 80)}...` : text
  }

  if (isLoading) {
    return <LoadingState message="加载帖子中..." />
  }

  if (error) {
    // 判断错误类型
    const isNetworkError =
      error.message?.includes("网络") || error.message?.includes("Network") || error.message?.includes("timeout")
    const isServerError = error.message?.includes("500") || error.message?.includes("服务器")

    let errorType: "error" | "network-error" = "error"
    let errorTitle = "加载失败"
    let errorDescription = error.message || "请稍后重试"

    if (isNetworkError) {
      errorType = "network-error"
      errorTitle = "网络连接失败"
      errorDescription = "无法连接到服务器，请检查网络后重试"
    } else if (isServerError) {
      errorTitle = "服务器错误"
      errorDescription = "服务器暂时无法响应，请稍后重试"
    }

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          type={errorType}
          title={errorTitle}
          description={errorDescription}
          action={{
            label: "重新加载",
            onClick: () => refetch(),
          }}
        />
      </div>
    )
  }

  // 获取公告优先级样式
  const getPriorityStyle = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200"
      case "HIGH":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200"
      case "NORMAL":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
      case "LOW":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // 获取公告优先级标签
  const getPriorityLabel = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "URGENT":
        return "紧急"
      case "HIGH":
        return "重要"
      case "NORMAL":
        return "普通"
      case "LOW":
        return "一般"
      default:
        return "公告"
    }
  }

  return (
    <div className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {announcements.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 shadow-sm">
            {(() => {
              const current = (announcements[activeAnnouncement] as Announcement) || (announcements[0] as Announcement)
              return (
                <div className="flex flex-col gap-4 p-6 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-sm font-semibold text-blue-700">
                      <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-blue-600 shadow-sm">
                        📢 公告
                        <span className="text-xs text-gray-400">
                          {activeAnnouncement + 1}/{announcements.length}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(current.priority)}`}
                      >
                        {getPriorityLabel(current.priority)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm transition hover:-translate-x-0.5 hover:bg-gray-50"
                        onClick={() =>
                          setActiveAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length)
                        }
                        aria-label="上一条公告"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一条
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm transition hover:translate-x-0.5 hover:bg-gray-50"
                        onClick={() => setActiveAnnouncement((prev) => (prev + 1) % announcements.length)}
                        aria-label="下一条公告"
                      >
                        下一条
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/announcements/${current.id}`)}
                    className="rounded-2xl bg-white/80 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{current.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{current.content}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{current.author?.nickname || "系统公告"}</div>
                        <div>{new Date(current.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })()}
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-50 p-2 text-orange-500">
                <Flame className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">精选置顶</h2>
              </div>
            </div>
            {pinnedPosts.length > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                {pinnedPosts.length} 条置顶
              </span>
            )}
          </div>

          {pinnedLoading ? (
            <LoadingState message="加载置顶帖子..." />
          ) : pinnedError ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-white px-6 py-4 text-sm text-red-600">
              置顶帖子加载失败
            </div>
          ) : pinnedPosts.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {pinnedPagePosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">置顶</span>
                        {post.isHot && (
                          <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-500">
                            热门
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{getPreview(post)}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        {post.author && (
                          <Avatar
                            alt={getAuthorName(post)}
                            src={post.author.avatar}
                            username={post.author.username}
                            seed={post.author.id}
                            size={32}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-800">{getAuthorName(post)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatNumber(getViews(post))}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {formatNumber(getComments(post))}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {formatNumber(getLikes(post))}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {totalPinnedPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pinnedPage <= 1}
                    onClick={() => setPinnedPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </button>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {pinnedPage}/{totalPinnedPages}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pinnedPage >= totalPinnedPages}
                    onClick={() => setPinnedPage((p) => Math.min(totalPinnedPages, p + 1))}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-5 text-sm text-gray-500">
              暂无置顶帖子，去发帖区看看吧~
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div ref={listRef} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* 顶部分类 & 排序 Tabs */}
              <div className="flex items-center justify-between gap-4 px-6 py-3">
                {/* 标签导航（固定分类） */}
                <div className="flex items-center gap-1">
                  {[
                    { key: null as string | null, label: "全部" },
                    { key: "学习交流" as string | null, label: "学习交流" },
                    { key: "教程" as string | null, label: "教程" },
                    { key: "二手交易" as string | null, label: "二手交易" },
                    { key: "校园生活" as string | null, label: "校园生活" },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => handleTagFilter(tab.key)}
                      className={`px-4 py-2 text-sm font-medium transition rounded-full ${
                        (!selectedTag && tab.key === null) || selectedTag === tab.key
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 排序选项 */}
                <div className="flex items-center">
                  <div className="flex items-center gap-1 rounded-full bg-gray-100 px-1 py-1">
                    {[
                      { key: "latest", label: "最新" },
                      { key: "popular", label: "热门" },
                      { key: "trending", label: "趋势" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setSortBy(option.key as SortType)
                          setPage(1)
                          // 切换排序时延迟滚动，等待数据加载
                          setTimeout(() => scrollToListTop(), 200)
                        }}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          sortBy === option.key
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 帖子列表 */}
              <div className="border-t divide-y divide-gray-100">
                {normalPosts.length > 0 ? (
                  normalPosts.map((post: any) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className="block px-6 py-4 transition hover:bg-gray-50"
                    >
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-900 transition-colors hover:text-blue-600">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{getPreview(post)}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex flex-wrap items-center gap-2">
                            {post.author && (
                              <Avatar
                                alt={getAuthorName(post)}
                                src={post.author.avatar}
                                username={post.author.username}
                                seed={post.author.id}
                                size={28}
                              />
                            )}
                            <span className="text-sm font-medium text-gray-800">{getAuthorName(post)}</span>
                            {getTags(post).length > 0 && (
                              <>
                                <span className="text-xs text-gray-300">|</span>
                                <div className="flex flex-wrap gap-1">
                                  {getTags(post)
                                    .slice(0, 3)
                                    .map((tag: string) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          handleTagFilter(tag)
                                        }}
                                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 transition hover:bg-gray-200"
                                      >
                                        #{tag}
                                      </button>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(post.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {formatNumber(getViews(post))}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {formatNumber(getComments(post))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-500">暂无更多内容了</div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-4">
                <div className="text-sm text-gray-500">
                  第 {page} / {totalPages || 1} 页
                  {selectedTag && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">#{selectedTag}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={page >= (totalPages || 1) || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar
                  alt={currentUser?.username || "用户"}
                  src={currentUser?.avatar}
                  username={currentUser?.username}
                  seed={currentUser?.id}
                  size={56}
                />
                <div>
                  <p className="text-sm text-gray-500">{currentUser ? "欢迎回来" : "游客模式"}</p>
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentUser?.nickname || currentUser?.username || "同学"}
                  </h3>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <button
                  onClick={() => navigate("/profile?tab=connections&subtab=following")}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2"
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentUser?.followingCount ?? currentUser?.following ?? "--"}
                  </div>
                  <div className="text-xs text-gray-400">关注</div>
                </button>
                <button
                  onClick={() => navigate("/profile?tab=connections&subtab=followers")}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2"
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentUser?.followersCount ?? currentUser?.followerCount ?? currentUser?.followers ?? "--"}
                  </div>
                  <div className="text-xs text-gray-400">粉丝</div>
                </button>
                <div className="p-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentUser?._count?.likes ?? (currentUser as any)?.likes ?? currentUser?.points ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">获赞</div>
                </div>
              </div>
              <Button fullWidth className="mt-4 rounded-full" onClick={() => navigate("/posts/new")}>
                去发帖
              </Button>
            </div>

            {popularTags.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-800">热门话题</h4>
                  </div>
                  <span className="text-xs text-gray-400">实时更新</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(({ tag }: { tag: string }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagFilter(tag)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  )
}
