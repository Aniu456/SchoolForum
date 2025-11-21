'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Avatar, PostCard, EmptyState, LoadingState, Button, Card } from '@/components'
import { formatTime } from '@/utils/format'
import { useAuthStore } from '@/store/useAuthStore'
import { usePosts } from '@/hooks/usePosts'
import { useFollowingActivities } from '@/hooks/useActivity'
import { useToast } from '@/utils/toast-hook'
import { favoriteApi, draftApi, followApi, type FavoriteFolder, type Favorite } from '@/api'
import type { Post } from '@/types'
import type { Draft } from '@/api/content/draft'
import { useUserFollowers, useUserFollowing } from '@/hooks/useUsers'
import { useQueryClient } from '@tanstack/react-query'

type Tab = 'posts' | 'favorites' | 'drafts' | 'connections' | 'activity' | 'settings'

export default function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: postsData, isLoading } = usePosts({})
  const posts = Array.isArray(postsData) ? postsData : postsData?.data || []

  // 关注/粉丝分页状态
  const [followingPage, setFollowingPage] = useState(1)
  const [followersPage, setFollowersPage] = useState(1)
  const CONNECTIONS_LIMIT = 20 // 每页显示 20 条

  const { data: followingData, isLoading: followingLoading, refetch: refetchFollowing } = useUserFollowing(currentUser?.id || '', followingPage, CONNECTIONS_LIMIT)
  const { data: followersData, isLoading: followersLoading, refetch: refetchFollowers } = useUserFollowers(currentUser?.id || '', followersPage, CONNECTIONS_LIMIT)

  // 关注状态管理
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})

  // 动态类型筛选
  const [activityType, setActivityType] = useState<'all' | 'posts' | 'comments' | 'likes' | 'favorites'>('all')

  // 动态分页和排序
  const [activityPage, setActivityPage] = useState(1)
  const [activitySortDesc, setActivitySortDesc] = useState(true) // true=倒序（最新在前），false=正序（最旧在前）
  const ACTIVITY_LIMIT = 20

  // 关注用户的动态流 - 后端已实现，返回格式: {type, id, author, content, createdAt, data}
  const { data: activitiesData, isLoading: isActivitiesLoading } = useFollowingActivities({ page: activityPage, limit: ACTIVITY_LIMIT })
  const allActivities = activitiesData?.data || []

  // 动态类型筛选和排序
  const filteredActivities = activityType === 'all'
    ? allActivities
    : allActivities.filter((activity: any) => {
      if (activityType === 'posts') return activity.type === 'POST'
      if (activityType === 'comments') return activity.type === 'COMMENT'
      if (activityType === 'likes') return activity.type === 'LIKE'
      if (activityType === 'favorites') return activity.type === 'FAVORITE'
      return true
    })

  // 排序逻辑
  const activities = [...filteredActivities].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return activitySortDesc ? timeB - timeA : timeA - timeB
  })

  // 收藏夹状态
  const [favoriteFolders, setFavoriteFolders] = useState<FavoriteFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderPosts, setFolderPosts] = useState<Favorite[]>([])
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false)

  // 草稿状态
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isDraftsLoading, setIsDraftsLoading] = useState(false)

  // 根据路由确定默认 tab
  const getDefaultTab = (): Tab => {
    if (location.pathname === '/settings') return 'settings'
    if (location.pathname === '/favorites') return 'favorites'
    if (location.pathname === '/drafts') return 'drafts'
    if (location.pathname === '/connections') return 'connections'
    if (location.pathname === '/activity') return 'activity'
    return 'posts'
  }

  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab())

  // 设置表单状态
  const [username, setUsername] = useState(currentUser?.username || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [avatar, setAvatar] = useState(currentUser?.avatar || '')
  const [isSaving, setIsSaving] = useState(false)

  // 加载收藏夹列表
  const loadFavoriteFolders = async () => {
    setIsFavoritesLoading(true)
    try {
      const response = await favoriteApi.getFolders()
      setFavoriteFolders(response.data || [])
    } catch {
      showError('加载收藏夹失败')
      setFavoriteFolders([])
    } finally {
      setIsFavoritesLoading(false)
    }
  }

  // 加载指定收藏夹的帖子
  const loadFolderPosts = async (folderId: string) => {
    try {
      const response = await favoriteApi.getFolderPosts(folderId)
      setFolderPosts(response.data || [])
    } catch {
      showError('加载收藏失败')
      setFolderPosts([])
    }
  }

  // 当 currentUser 变化时，同步状态
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '')
      setEmail(currentUser.email || '')
      setBio(currentUser.bio || '')
      setAvatar(currentUser.avatar || '')
    }
  }, [currentUser])

  // 处理关注/取消关注
  const handleToggleFollow = async (userId: string, currentlyFollowing: boolean) => {
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

      // 刷新列表
      await refetchFollowing()
      await refetchFollowers()
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

      await refetchFollowing()
      await refetchFollowers()
    }
  }

  // 加载草稿列表
  const loadDrafts = async () => {
    setIsDraftsLoading(true)
    try {
      const response = await draftApi.getList({ page: 1, limit: 50 })
      setDrafts(response.data || [])
    } catch {
      showError('加载草稿失败')
      setDrafts([])
    } finally {
      setIsDraftsLoading(false)
    }
  }

  // 页面加载时获取收藏夹和草稿数据
  useEffect(() => {
    loadFavoriteFolders()
    loadDrafts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!currentUser) {
    navigate('/login')
    return null
  }

  if (isLoading) {
    return <LoadingState message="加载中..." />
  }

  // 用户的帖子
  const userPosts = posts.filter((post: Post) => post.author && post.author.id === currentUser.id)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // 模拟保存
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showSuccess('设置已保存')
    } catch {
      showError('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 用户信息卡片 */}
      <Card className="mb-8 p-8">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {/* 头像 */}
          <div className="mb-4 md:mb-0">
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.username}
              username={currentUser.username}
              size={96}
              seed={currentUser.id}
              className="border-4 border-blue-500"
            />
          </div>

          {/* 用户信息 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{currentUser.username}</h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">{currentUser.email}</p>
            {currentUser.bio && <p className="mb-4 text-gray-700 dark:text-gray-300">{currentUser.bio}</p>}
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">注册时间</div>
                <div className="font-semibold text-green-700 dark:text-green-300">
                  {formatTime(currentUser.createdAt)}
                </div>
              </div>
              <div className="rounded-lg bg-purple-100 px-4 py-2 dark:bg-purple-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">发帖数</div>
                <div className="font-semibold text-purple-700 dark:text-purple-300">{userPosts.length}</div>
              </div>
              <div className="rounded-lg bg-orange-100 px-4 py-2 dark:bg-orange-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">关注</div>
                <div className="font-semibold text-orange-700 dark:text-orange-300">
                  {currentUser.followingCount ?? 0}
                </div>
              </div>
              <div className="rounded-lg bg-pink-100 px-4 py-2 dark:bg-pink-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">粉丝</div>
                <div className="font-semibold text-pink-700 dark:text-pink-300">
                  {currentUser.followerCount ?? 0}
                </div>
              </div>
              <div className="rounded-lg bg-yellow-100 px-4 py-2 dark:bg-yellow-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">积分</div>
                <div className="font-semibold text-yellow-700 dark:text-yellow-300">{currentUser.points ?? 0}</div>
              </div>
              <div className="rounded-lg bg-indigo-100 px-4 py-2 dark:bg-indigo-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">等级</div>
                <div className="font-semibold text-indigo-700 dark:text-indigo-300">Lv.{currentUser.level ?? 1}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => handleTabChange('posts')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'posts'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          我的帖子 ({userPosts.length})
        </Button>
        <Button
          onClick={() => handleTabChange('favorites')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'favorites'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          收藏夹 ({favoriteFolders.length})
        </Button>
        <Button
          onClick={() => handleTabChange('drafts')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'drafts'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          草稿 ({drafts.length})
        </Button>
        <Button
          onClick={() => handleTabChange('connections')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'connections'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          关注/粉丝
        </Button>
        <Button
          onClick={() => handleTabChange('activity')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'activity'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          动态
        </Button>
        <Button
          onClick={() => handleTabChange('settings')}
          variant="ghost"
          className={`pb-4 text-lg font-medium ${activeTab === 'settings'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
          设置
        </Button>
      </div>

      {/* 我的帖子 */}
      {activeTab === 'posts' && (
        <div>
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post: Post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState
                title="还没有发布过帖子"
                description="快去发布你的第一篇帖子吧！"
                icon="📝"
                action={{
                  label: '去发帖',
                  onClick: () => navigate('/posts/new'),
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 收藏夹 */}
      {activeTab === 'favorites' && (
        <div>
          {isFavoritesLoading ? (
            <LoadingState message="加载收藏夹..." />
          ) : favoriteFolders.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer p-4 transition-shadow hover:shadow-lg"
                    onClick={() => {
                      setSelectedFolder(folder.id)
                      loadFolderPosts(folder.id)
                    }}>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {folder.name}
                    </h3>
                    {folder.description && (
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        {folder.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {folder.favoriteCount} 个收藏
                    </p>
                  </Card>
                ))}
              </div>

              {/* 显示选中收藏夹的帖子 */}
              {selectedFolder && folderPosts.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    收藏的帖子
                  </h3>
                  {folderPosts.map((favorite) => (
                    favorite.post && <PostCard key={favorite.id} post={favorite.post} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="还没有收藏夹"
              description="创建收藏夹来整理你喜欢的内容吧！"
              icon="⭐"
            />
          )}
        </div>
      )}

      {/* 草稿 */}
      {activeTab === 'drafts' && (
        <div>
          {isDraftsLoading ? (
            <LoadingState message="加载草稿..." />
          ) : drafts.length > 0 ? (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {draft.title || '无标题草稿'}
                      </h3>
                      {draft.content && (
                        <p className="mb-3 line-clamp-2 text-gray-600 dark:text-gray-400">
                          {draft.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                      )}
                      {draft.tags && draft.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {draft.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        最后编辑：{formatTime(draft.updatedAt)}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/posts/new?draft=${draft.id}`)}>
                        继续编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await draftApi.delete(draft.id)
                            showSuccess('草稿已删除')
                            loadDrafts()
                          } catch {
                            showError('删除失败')
                          }
                        }}>
                        删除
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="暂无草稿"
              description="开始写作，系统会自动保存您的草稿"
              icon="📝"
              action={{
                label: '去发帖',
                onClick: () => navigate('/posts/new'),
              }}
            />
          )}
        </div>
      )}
      {/* 关注/粉丝 */}
      {activeTab === 'connections' && (
        <div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 关注列表 */}
            <Card className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                我的关注 ({currentUser.followingCount ?? 0})
              </h3>
              {followingLoading ? (
                <LoadingState message="加载关注列表..." />
              ) : (followingData as any)?.data?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(followingData as any)?.data?.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <div
                          className="flex flex-1 cursor-pointer items-center gap-3"
                          onClick={() => navigate(`/users/${u.id}`)}>
                          <Avatar src={u.avatar} alt={u.username} username={u.username} size={40} seed={u.id} />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{u.nickname || u.username}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              关注 {u.followingCount ?? 0} · 粉丝 {u.followerCount ?? 0}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFollow(u.id, true)
                            }}>
                            取消关注
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 分页控件 */}
                  <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      第 {followingPage} 页，共 {(followingData as any)?.meta?.totalPages || 1} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followingPage === 1}
                        onClick={() => setFollowingPage(p => Math.max(1, p - 1))}>
                        上一页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followingPage >= ((followingData as any)?.meta?.totalPages || 1)}
                        onClick={() => setFollowingPage(p => p + 1)}>
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="暂无关注"
                  description="快去关注感兴趣的用户吧！"
                  icon="👥"
                />
              )}
            </Card>

            {/* 粉丝列表 */}
            <Card className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                我的粉丝 ({currentUser.followerCount ?? 0})
              </h3>
              {followersLoading ? (
                <LoadingState message="加载粉丝列表..." />
              ) : (followersData as any)?.data?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(followersData as any)?.data?.map((u: any) => {
                      // 检查是否互相关注
                      const isFollowingBack = followingStates[u.id] ?? ((followingData as any)?.data?.some((f: any) => f.id === u.id) || false)

                      return (
                        <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                          <div
                            className="flex flex-1 cursor-pointer items-center gap-3"
                            onClick={() => navigate(`/users/${u.id}`)}>
                            <Avatar src={u.avatar} alt={u.username} username={u.username} size={40} seed={u.id} />
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{u.nickname || u.username}</div>
                                {isFollowingBack && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    互相关注
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                关注 {u.followingCount ?? 0} · 粉丝 {u.followerCount ?? 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isFollowingBack ? "outline" : "primary"}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFollow(u.id, isFollowingBack)
                              }}>
                              {isFollowingBack ? '已关注' : '关注'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* 分页控件 */}
                  <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      第 {followersPage} 页，共 {(followersData as any)?.meta?.totalPages || 1} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followersPage === 1}
                        onClick={() => setFollowersPage(p => Math.max(1, p - 1))}>
                        上一页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followersPage >= ((followersData as any)?.meta?.totalPages || 1)}
                        onClick={() => setFollowersPage(p => p + 1)}>
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="暂无粉丝"
                  description="发布优质内容吸引粉丝关注吧！"
                  icon="⭐"
                />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 动态 */}
      {activeTab === 'activity' && (
        <div>
          {/* 动态类型切换、排序和统计信息 */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-4">
              <Button
                size="sm"
                variant={activityType === 'all' ? 'primary' : 'outline'}
                onClick={() => setActivityType('all')}>
                全部
              </Button>
              <Button
                size="sm"
                variant={activityType === 'posts' ? 'primary' : 'outline'}
                onClick={() => setActivityType('posts')}>
                帖子
              </Button>
              <Button
                size="sm"
                variant={activityType === 'comments' ? 'primary' : 'outline'}
                onClick={() => setActivityType('comments')}>
                评论
              </Button>
              <Button
                size="sm"
                variant={activityType === 'likes' ? 'primary' : 'outline'}
                onClick={() => setActivityType('likes')}>
                点赞
              </Button>
              <Button
                size="sm"
                variant={activityType === 'favorites' ? 'primary' : 'outline'}
                onClick={() => setActivityType('favorites')}>
                收藏
              </Button>
            </div>

            {/* 排序和统计信息 */}
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActivitySortDesc(!activitySortDesc)}>
                {activitySortDesc ? '最新' : '最旧'}
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                共 {activitiesData?.meta?.total || 0} 条动态
              </div>
            </div>
          </div>

          {isActivitiesLoading ? (
            <LoadingState message="加载动态..." />
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <Card key={activity.id} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 作者头像 */}
                    <Link to={`/users/${activity.author.id}`}>
                      <Avatar
                        src={activity.author.avatar}
                        alt={activity.author.username}
                        username={activity.author.username}
                        size={48}
                        seed={activity.author.id}
                      />
                    </Link>

                    {/* 动态内容 */}
                    <div className="flex-1">
                      {/* 新帖子 */}
                      {activity.type === 'POST' && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发布了新帖子</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg bg-gray-50 p-4 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {activity.content}
                              </p>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      {/* 评论 */}
                      {activity.type === 'COMMENT' && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发表了评论</span>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {activity.content}
                            </p>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(activity.createdAt)}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 公告 */}
                      {activity.type === 'ANNOUNCEMENT' && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发布了公告</span>
                          </div>
                          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                            <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                              {activity.data.title}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {activity.content}
                            </p>
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              {formatTime(activity.createdAt)}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 点赞 */}
                      {activity.type === 'LIKE' && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 点赞了</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      {/* 收藏 */}
                      {activity.type === 'FAVORITE' && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 收藏了</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* 分页控件 */}
              <div className="mt-6 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  第 {activityPage} 页，共 {activitiesData?.meta?.totalPages || 1} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={activityPage === 1}
                    onClick={() => setActivityPage(p => Math.max(1, p - 1))}>
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={activityPage >= (activitiesData?.meta?.totalPages || 1)}
                    onClick={() => setActivityPage(p => p + 1)}>
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="暂无动态"
              description="关注用户后，这里将展示他们的新帖子和你收到的评论"
              icon="📊"
            />
          )}
        </div>
      )}

      {/* 设置 */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* 个人资料 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">个人资料</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">头像</label>
                <div className="flex items-center gap-4">
                  <Avatar src={avatar} alt="头像" username={username} size={80} seed={currentUser.id} />
                  <Button variant="outline" size="sm" type="button">
                    更换头像
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邮箱
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  个人简介
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={200}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="介绍一下自己..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{bio.length}/200</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </form>
          </Card>

          {/* 偏好设置 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">偏好设置</h2>
            <div className="space-y-4">


              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">邮件通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">接收邮件通知</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:after:border-gray-600 dark:after:bg-gray-300 dark:peer-checked:bg-blue-500 dark:peer-focus:ring-blue-800"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">推送通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">接收浏览器推送通知</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:after:border-gray-600 dark:after:bg-gray-300 dark:peer-checked:bg-blue-500 dark:peer-focus:ring-blue-800"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* 账户安全 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">账户安全</h2>
            <div className="space-y-4">
              <button className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                修改密码
              </button>
              <button className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-left text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20">
                删除账户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
