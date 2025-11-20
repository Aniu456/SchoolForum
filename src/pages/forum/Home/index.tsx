'use client'

import { useState, useMemo } from 'react'
import { PostCard, LoadingState, EmptyState, InfiniteScroll, Button } from '@/components'
import { useInfinitePosts } from '@/hooks/useInfinitePosts'
import { SortType } from '@/types'

export default function Home() {
  const [sortBy, setSortBy] = useState<SortType>('latest')

  // 使用 useMemo 稳定参数对象，避免无限请求
  const queryParams = useMemo(() => ({
    sortBy,
    limit: 10,
  }), [sortBy])

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts(queryParams)

  // 处理分页响应数据（兼容后端返回的多种结构）
  const rawPosts =
    data?.pages.flatMap((page: any) => {
      const paginated =
        page?.data && Array.isArray(page.data.data)
          ? page.data
          : page?.data && Array.isArray(page.data)
            ? page
            : page

      const posts = paginated?.data
      return Array.isArray(posts) ? posts : []
    }) || []

  // 去重，防止因为数据更新导致的分页重复
  const allPosts = Array.from(new Map(rawPosts.map((post) => [post.id, post])).values())

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

  // 置顶帖子
  const pinnedPosts = allPosts.filter((post) => post.isPinned ?? false)
  // 普通帖子
  const normalPosts = allPosts.filter((post) => !post.isPinned)

  // 计算热门标签
  const getPopularTags = () => {
    const tagCounts: Record<string, number> = {}
    allPosts.forEach((post) => {
      post.tags?.forEach((tag: string | number) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  }

  const popularTags = getPopularTags()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 顶部区域：置顶帖子 */}
      <div className="mb-6 bg-white dark:bg-gray-900">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">最新帖子</h2>

        {/* 置顶帖子 */}
        {pinnedPosts.length > 0 ? (
          <div className="mt-6 space-y-4">
            {pinnedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
            暂无置顶帖子
          </div>
        )}
      </div>

      {/* 中间区域：热门标签和统计信息 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 左侧：热门标签 */}
        <div className="bg-white dark:bg-gray-900">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">🏷️ 热门标签</h3>
          {popularTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {popularTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">暂无标签</div>
          )}
        </div>
      </div>
      {/* 底部：帖子列表 */}
      <div className="bg-white dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">📝 帖子列表</h3>
          <div className="flex gap-2">
            <Button variant={sortBy === 'latest' ? 'primary' : 'outline'} size="sm" onClick={() => setSortBy('latest')}>最新</Button>
            <Button variant={sortBy === 'popular' ? 'primary' : 'outline'} size="sm" onClick={() => setSortBy('popular')}>热门</Button>
            <Button variant={sortBy === 'trending' ? 'primary' : 'outline'} size="sm" onClick={() => setSortBy('trending')}>trending</Button>
          </div>
        </div>

        {normalPosts.length > 0 ? (
          <div className="space-y-4">
            {normalPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            暂无更多内容了
          </div>
        )}

        {/* 无限滚动 */}
        <InfiniteScroll
          hasNextPage={hasNextPage || false}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  )
}
