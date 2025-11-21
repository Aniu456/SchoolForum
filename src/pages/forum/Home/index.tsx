'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PostCard, LoadingState, EmptyState, Button } from '@/components'
import { announcementApi, Announcement, AnnouncementPriority } from '@/api/content/announcement'
import { searchApi } from '@/api'
import { postApi, recommendationApi } from '@/api'
import { SortType } from '@/types'

export default function Home() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortType>('latest')
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [pinnedPage, setPinnedPage] = useState(1)
  const PAGE_SIZE = 20
  const PINNED_PAGE_SIZE = 4

  // 获取公告列表
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementApi.getAnnouncements({ limit: 5 }),
  })

  const announcements = announcementsData?.data?.data || announcementsData?.data || []

  useEffect(() => {
    if (!announcements.length) return
    const timer = window.setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcements.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [announcements.length])

  // 热门标签（使用后端数据）
  const { data: popularTagsData } = useQuery({
    queryKey: ['popular-tags', 8],
    queryFn: () => searchApi.getPopularTags(8),
  })
  const popularTags = Array.isArray(popularTagsData)
    ? popularTagsData
    : Array.isArray((popularTagsData as any)?.data)
      ? (popularTagsData as any).data
      : []

  // 置顶帖子独立获取，避免随排序切换
  const { data: pinnedData, isLoading: pinnedLoading, error: pinnedError } = useQuery({
    queryKey: ['posts', 'pinned'],
    queryFn: async () =>
      postApi.getPosts({
        page: 1,
        limit: 200, // 拉宽范围，避免置顶不在首页时丢失
        sortBy: 'createdAt',
        order: 'desc',
      }),
    staleTime: 1000 * 60 * 5,
  })
  const pinnedFromFetch = (
    ((pinnedData as any)?.data ?? (pinnedData as any)?.data?.data ?? []) as any[]
  ).filter((post: any) => post.isPinned)

  const {
    data: postsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['posts', 'home', sortBy, page, selectedTag],
    keepPreviousData: true,
    queryFn: async () => {
      // map sort to backend endpoints
      if (!selectedTag && sortBy === 'trending') {
        return recommendationApi.getTrendingPosts(page, PAGE_SIZE)
      }
      if (!selectedTag && sortBy === 'popular') {
        return recommendationApi.getHotPosts(page, PAGE_SIZE)
      }
      const params: any = {
        page,
        limit: PAGE_SIZE,
        sortBy: sortBy === 'latest' ? 'createdAt' : 'viewCount',
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
    const combined = [...pinnedFromFetch, ...pagePosts.filter((p) => p.isPinned)]
    const map = new Map<string, any>()
    combined.forEach((p) => {
      if (p?.id && p.isPinned) {
        map.set(p.id, p)
      }
    })
    return Array.from(map.values())
  }, [pinnedFromFetch, pagePosts])

  const totalPinnedPages = Math.max(1, Math.ceil((pinnedPosts.length || 0) / PINNED_PAGE_SIZE))
  const pinnedPagePosts = pinnedPosts.slice((pinnedPage - 1) * PINNED_PAGE_SIZE, pinnedPage * PINNED_PAGE_SIZE)

  // 不展示置顶在列表里
  const normalPosts = pagePosts.filter((post) => !post.isPinned)

  if (isLoading) {
    return <LoadingState message="加载帖子中..." />
  }

  if (error) {
    // 判断错误类型
    const isNetworkError = error.message?.includes('网络') || error.message?.includes('Network') || error.message?.includes('timeout')
    const isServerError = error.message?.includes('500') || error.message?.includes('服务器')

    let errorType: 'error' | 'network-error' = 'error'
    let errorTitle = '加载失败'
    let errorDescription = error.message || '请稍后重试'

    if (isNetworkError) {
      errorType = 'network-error'
      errorTitle = '网络连接失败'
      errorDescription = '无法连接到服务器，请检查网络后重试'
    } else if (isServerError) {
      errorTitle = '服务器错误'
      errorDescription = '服务器暂时无法响应，请稍后重试'
    }

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          type={errorType}
          title={errorTitle}
          description={errorDescription}
          action={{
            label: '重新加载',
            onClick: () => refetch(),
          }}
        />
      </div>
    )
  }

  // 获取公告优先级样式
  const getPriorityStyle = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
      case 'LOW':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  // 获取公告优先级标签
  const getPriorityLabel = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return '紧急'
      case 'HIGH':
        return '重要'
      case 'NORMAL':
        return '普通'
      case 'LOW':
        return '一般'
      default:
        return '公告'
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 公告区域 - 轮播 banner */}
      {announcements.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm dark:border-blue-900/50 dark:from-slate-900 dark:to-indigo-900/30">
          {(() => {
            const current = (announcements[activeAnnouncement] as Announcement) || (announcements[0] as Announcement)
            return (
              <div className="relative p-6 sm:p-8">
                <div className="mb-3 flex items-center gap-3 text-sm font-semibold text-blue-700 dark:text-blue-200">
                  <span className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm backdrop-blur dark:bg-slate-800/70">
                    📢 系统公告
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activeAnnouncement + 1}/{announcements.length}
                    </span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(current.priority)}`}>
                    {getPriorityLabel(current.priority)}
                  </span>
                </div>
                <div
                  className="cursor-pointer rounded-xl bg-white/80 p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900/70"
                  onClick={() => navigate(`/announcements/${current.id}`)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{current.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {current.content}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <div>{current.author.nickname}</div>
                      <div>{new Date(current.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-x-0.5 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                      onClick={() => setActiveAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length)}
                      aria-label="上一条公告"
                    >
                      ← 上一条
                    </button>
                    <button
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm transition hover:translate-x-0.5 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                      onClick={() => setActiveAnnouncement((prev) => (prev + 1) % announcements.length)}
                      aria-label="下一条公告"
                    >
                      下一条 →
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAnnouncement(idx)}
                        className={`h-2.5 w-6 rounded-full transition ${idx === activeAnnouncement ? 'bg-blue-600' : 'bg-blue-200 hover:bg-blue-300 dark:bg-slate-600 dark:hover:bg-slate-500'}`}
                        aria-label={`切换到第 ${idx + 1} 条公告`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </section>
      )}

      {/* 置顶帖子专区 */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">置顶专区</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">精选置顶帖子</h2>
          </div>
          {pinnedPosts.length > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {pinnedPosts.length} 条置顶
            </span>
          )}
        </div>
        {pinnedLoading ? (
          <LoadingState message="加载置顶帖子..." />
        ) : pinnedError ? (
          <div className="rounded-lg border border-dashed border-red-200 bg-white px-6 py-4 text-sm text-red-600 dark:border-red-800 dark:bg-gray-900 dark:text-red-300">
            置顶帖子加载失败
          </div>
        ) : pinnedPosts.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {pinnedPagePosts.map((post) => (
                <div key={post.id} className="relative">
                  <div className="absolute right-4 top-3 flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    📌 置顶
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-[0_15px_50px_rgba(0,0,0,0.08)] ring-1 ring-amber-100/60 dark:bg-gray-900 dark:ring-amber-800/40">
                    <PostCard post={post} onTagClick={(tag) => setSelectedTag(tag)} />
                  </div>
                </div>
              ))}
            </div>
            {totalPinnedPages > 1 && (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" disabled={pinnedPage <= 1} onClick={() => setPinnedPage((p) => Math.max(1, p - 1))}>
                  上一页
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pinnedPage}/{totalPinnedPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pinnedPage >= totalPinnedPages}
                  onClick={() => setPinnedPage((p) => Math.min(totalPinnedPages, p + 1))}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-4 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            暂无置顶帖子，去发帖区看看吧~
          </div>
        )}
      </div>

      {/* 底部：帖子列表 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">📝 帖子列表</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">选择排序或直接点击标签快速筛选</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={sortBy === 'latest' ? 'primary' : 'outline'} size="sm" onClick={() => { setSortBy('latest'); setPage(1) }}>最新</Button>
            <Button variant={sortBy === 'popular' ? 'primary' : 'outline'} size="sm" onClick={() => { setSortBy('popular'); setPage(1) }}>热门</Button>
            <Button variant={sortBy === 'trending' ? 'primary' : 'outline'} size="sm" onClick={() => { setSortBy('trending'); setPage(1) }}>趋势</Button>
          </div>
        </div>

        {popularTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedTag(null)
                setPage(1)
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition ${selectedTag ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700' : 'bg-blue-600 text-white shadow-sm'}`}
            >
              全部
            </button>
            {popularTags.map(({ tag, count }: { tag: string; count: number }) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag)
                  setPage(1)
                }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition ${selectedTag === tag
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-900/40 dark:hover:text-blue-300'
                  }`}
              >
                #{tag}
                <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <LoadingState message="加载帖子中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={(error as any)?.message || '请稍后重试'}
            action={{ label: '重新加载', onClick: () => refetch() }}
          />
        ) : normalPosts.length > 0 ? (
          <div className="space-y-4">
            {normalPosts.map((post) => (
              <PostCard key={post.id} post={post} onTagClick={(tag) => { setSelectedTag(tag); setPage(1) }} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            暂无更多内容了
          </div>
        )}

        {/* 分页器 */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            第 {page} / {totalPages || 1} 页
            {selectedTag && <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">#{selectedTag}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              上一页
            </Button>
            <Button size="sm" variant="outline" disabled={page >= (totalPages || 1) || isFetching} onClick={() => setPage((p) => p + 1)}>
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
