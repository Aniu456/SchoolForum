import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PostCard, Avatar, EmptyState, LoadingState, Button, Card } from '@/components'
import { searchApi, followApi } from '@/api'
import { Post, User } from '@/types'
import { useAuthStore } from '@/store/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/utils/toast-hook'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || searchParams.get('tag') || ''
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<'posts' | 'users'>('posts')
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'popular'>('latest')

  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 关注功能
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({})

  // 同步 URL 参数到本地状态
  useEffect(() => {
    const urlQuery = searchParams.get('q') || searchParams.get('tag') || ''
    if (urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])

  // 搜索帖子和用户
  useEffect(() => {
    const searchAll = async () => {
      const raw = query.trim()
      const isTagSearch = raw.startsWith('#') || !!searchParams.get('tag')
      const tagValue = searchParams.get('tag') || (raw.startsWith('#') ? raw.slice(1) : '')
      const keyword = isTagSearch ? '' : raw

      if (!keyword && !tagValue) {
        setPosts([])
        setUsers([])
        return
      }

      // 同时搜索帖子和用户
      setLoadingPosts(true)
      setLoadingUsers(true)

      try {
        const postParams: any = { page: 1, limit: 20 }
        if (tagValue) postParams.tag = tagValue
        if (keyword) postParams.q = keyword

        const [postsRes, usersRes] = await Promise.all([
          searchApi.searchPosts(postParams).catch((err) => {
            console.error('搜索帖子失败:', err)
            return { data: [] }
          }),
          searchApi.searchUsers({ q: keyword || tagValue, page: 1, limit: 20 }).catch((err) => {
            console.error('搜索用户失败:', err)
            return { data: [] }
          }),
        ])

        setPosts(postsRes.data as Post[])
        setUsers(usersRes.data as User[])

        // 检查关注状态
        if (currentUser && usersRes.data) {
          const userList = usersRes.data as User[]
          const followStates: Record<string, boolean> = {}
          await Promise.all(
            userList.map(async (u) => {
              if (u.id !== currentUser.id) {
                try {
                  const { isFollowing } = await followApi.checkFollowing(u.id)
                  followStates[u.id] = isFollowing
                } catch (error) {
                  console.error(`检查关注状态失败:`, error)
                  followStates[u.id] = false
                }
              }
            })
          )
          setFollowingStates(followStates)
        }
      } finally {
        setLoadingPosts(false)
        setLoadingUsers(false)
      }
    }

    searchAll()
  }, [query, searchParams, currentUser])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = query.trim()
    if (raw.startsWith('#')) {
      setSearchParams({ tag: raw.slice(1) })
      return
    }
    if (raw) {
      setSearchParams({ q: raw })
    }
  }

  // 关注/取消关注
  const handleToggleFollow = async (userId: string, currentlyFollowing: boolean) => {
    if (!currentUser) {
      showError('请先登录')
      return
    }

    setFollowingLoading(prev => ({ ...prev, [userId]: true }))

    try {
      if (currentlyFollowing) {
        await followApi.unfollowUser(userId)
        showSuccess('已取消关注')
      } else {
        await followApi.followUser(userId)
        showSuccess('关注成功')
      }

      // 刷新缓存
      await queryClient.invalidateQueries({ queryKey: ['user', userId] })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['followers'] })
      await queryClient.invalidateQueries({ queryKey: ['following'] })

      // 重新检查关注状态
      const { isFollowing } = await followApi.checkFollowing(userId)
      setFollowingStates(prev => ({ ...prev, [userId]: isFollowing }))
    } catch (error: any) {
      console.error('关注操作错误:', error)
      const errorMessage = error?.message || error?.response?.data?.message || error?.data?.message || ''

      if (errorMessage.includes('已经关注') || errorMessage.includes('已关注')) {
        showSuccess('已关注')
        setFollowingStates(prev => ({ ...prev, [userId]: true }))
      } else if (errorMessage.includes('未关注')) {
        showSuccess('已取消关注')
        setFollowingStates(prev => ({ ...prev, [userId]: false }))
      } else {
        showError(`操作失败：${errorMessage || '请重试'}`)
      }
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const curPosts = posts
  const curUsers = users

  // 排序帖子
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === 'hot') {
      return (b.viewCount ?? 0) - (a.viewCount ?? 0)
    } else {
      return (b.likeCount ?? 0) - (a.likeCount ?? 0)
    }
  })

  // 判断当前是否正在加载
  const isLoading = searchType === 'posts' ? loadingPosts : loadingUsers

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        {/* 搜索类型切换 */}
        <div className="flex gap-4">
          <Button variant={searchType === 'posts' ? 'primary' : 'outline'} onClick={() => setSearchType('posts')}>
            帖子 ({posts.length})
          </Button>
          <Button variant={searchType === 'users' ? 'primary' : 'outline'} onClick={() => setSearchType('users')}>
            用户 ({users.length})
          </Button>
        </div>
      </div>
      {/* 搜索结果 */}
      {isLoading ? (
        <LoadingState message="搜索中..." />
      ) : query ? (
        <>
          {searchType === 'posts' ? (
            <div>
              {/* 排序选项 */}
              {curPosts.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-gray-600 dark:text-gray-400">找到 {posts.length} 个相关帖子</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={sortBy === 'latest' ? 'primary' : 'outline'}
                      onClick={() => setSortBy('latest')}>
                      最新
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'hot' ? 'primary' : 'outline'}
                      onClick={() => setSortBy('hot')}>
                      热门
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'popular' ? 'primary' : 'outline'}
                      onClick={() => setSortBy('popular')}>
                      最热
                    </Button>
                  </div>
                </div>
              )}

              {/* 帖子列表 */}
              <div className="space-y-4">
                {sortedPosts.length > 0 ? (
                  sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <EmptyState title="没有找到相关帖子" description="试试其他关键词或浏览其他内容" icon="🔍" />
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">找到 {curUsers.length} 个相关用户</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {curUsers.length > 0 ? (
                  curUsers.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id
                    const isFollowing = followingStates[user.id] || false
                    const isLoading = followingLoading[user.id] || false

                    return (
                      <Card key={user.id} className="p-6 transition-shadow hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <Link to={`/users/${user.id}`} className="flex items-start gap-4">
                            <Avatar
                              src={user.avatar}
                              alt={user.username}
                              username={user.username}
                              size={56}
                              seed={user.id}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {user.nickname || user.username}
                                </h3>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  @{user.username}
                                </span>
                              </div>
                              {user.bio && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span>帖子 {user.postCount ?? user._count?.posts ?? 0}</span>
                                <span>关注 {user.followingCount ?? user.following ?? 0}</span>
                                <span>粉丝 {user.followerCount ?? user.followersCount ?? user.followers ?? 0}</span>
                              </div>
                            </div>
                          </Link>
                          {!isCurrentUser && currentUser && (
                            <Button
                              size="sm"
                              variant={isFollowing ? "outline" : "primary"}
                              disabled={isLoading}
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleFollow(user.id, isFollowing)
                              }}>
                              {isLoading ? '处理中...' : (isFollowing ? '已关注' : '关注')}
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="col-span-full">
                    <EmptyState title="没有找到相关用户" description="试试其他关键词" icon="👤" />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="请输入搜索关键词" description="搜索帖子、用户或标签" icon="🔍" />
      )}
    </div>
  )
}
