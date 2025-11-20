'use client'

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, PostCard, EmptyState, LoadingState, Card, Button } from '@/components'
import { formatTime } from '@/utils/format'
import { followApi } from '@/api'
import { useToast } from '@/utils/toast-hook'
import { useUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/useAuthStore'
import { usePosts } from '@/hooks/usePosts'
import NotFoundPage from '@/pages/system/NotFound'
import type { Post } from '@/types'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { user: currentUser } = useAuthStore()
  const { data: user, isLoading, error, refetch } = useUser(id ?? '')
  const { data: userPostsData } = usePosts({})
  const userPosts = Array.isArray(userPostsData) ? userPostsData : userPostsData?.data || []
  const [following, setFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'collections' | 'following' | 'followers'>('posts')

  const filteredUserPosts = userPosts.filter((post: Post) => post.author && post.author.id === id)

  useEffect(() => {
    const checkFollow = async () => {
      if (user && currentUser && id) {
        try {
          const { isFollowing } = await followApi.checkFollowing(id)
          setFollowing(isFollowing)
        } catch (error) {
          console.error('检查关注状态失败:', error)
        }
      }
    }
    checkFollow()
  }, [user, currentUser, id])

  if (!id) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return <LoadingState message="加载用户信息中..." />
  }

  if (error || !user) {
    // 判断错误类型
    const is404 = error?.message?.includes('404') || error?.message?.includes('不存在') || !user
    const isNetworkError = error?.message?.includes('网络') || error?.message?.includes('Network') || error?.message?.includes('timeout')
    const isPermissionError = error?.message?.includes('403') || error?.message?.includes('权限')

    let errorType: 'error' | 'not-found' | 'network-error' | 'permission-denied' = 'error'
    let errorTitle = '加载失败'
    let errorDescription = error?.message || '用户不存在'

    if (is404) {
      errorType = 'not-found'
      errorTitle = '用户不存在'
      errorDescription = '该用户可能已被删除或不存在'
    } else if (isNetworkError) {
      errorType = 'network-error'
      errorTitle = '网络连接失败'
      errorDescription = '无法连接到服务器，请检查网络后重试'
    } else if (isPermissionError) {
      errorType = 'permission-denied'
      errorTitle = '无权访问'
      errorDescription = '您没有权限查看此用户信息'
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          type={errorType}
          title={errorTitle}
          description={errorDescription}
          action={{
            label: '重新加载',
            onClick: () => refetch(),
          }}
          showHomeButton={true}
        />
      </div>
    )
  }

  const isCurrentUser = currentUser && user.id === currentUser.id

  const handleFollow = async () => {
    if (!currentUser || !id) return
    try {
      if (following) {
        await followApi.unfollowUser(id)
        setFollowing(false)
        showSuccess('已取消关注')
      } else {
        await followApi.followUser(id)
        setFollowing(true)
        showSuccess('关注成功')
      }
    } catch (error) {
      showError('操作失败，请重试')
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
              src={user.avatar}
              alt={user.username}
              username={user.username}
              size={120}
              seed={user.id}
              className="border-4 border-blue-500"
            />
          </div>

          {/* 用户信息 */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4 flex items-center justify-center gap-4 md:justify-start">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h1>
              {!isCurrentUser && (
                <Button onClick={handleFollow} variant={following ? 'outline' : 'primary'}>
                  {following ? '已关注' : '关注'}
                </Button>
              )}
            </div>
            {user.email && <p className="mb-4 text-gray-600 dark:text-gray-400">{user.email}</p>}
            {user.bio && <p className="mb-4 text-gray-700 dark:text-gray-300">{user.bio}</p>}
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="rounded-lg bg-blue-100 px-4 py-2 dark:bg-blue-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">角色</div>
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  {user.role === 'student' ? '学生' : user.role === 'teacher' ? '教师' : '管理员'}
                </div>
              </div>
              <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">注册时间</div>
                <div className="font-semibold text-green-700 dark:text-green-300">{formatTime(user.createdAt)}</div>
              </div>
              <div className="rounded-lg bg-purple-100 px-4 py-2 dark:bg-purple-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">发帖数</div>
                <div className="font-semibold text-purple-700 dark:text-purple-300">{filteredUserPosts.length}</div>
              </div>
              <div className="rounded-lg bg-orange-100 px-4 py-2 dark:bg-orange-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">关注</div>
                <div className="font-semibold text-orange-700 dark:text-orange-300">
                  {user.followingCount ?? user.stats?.followingCount ?? 0}
                </div>
              </div>
              <div className="rounded-lg bg-pink-100 px-4 py-2 dark:bg-pink-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">粉丝</div>
                <div className="font-semibold text-pink-700 dark:text-pink-300">
                  {user.followerCount ?? user.stats?.followerCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          {isCurrentUser && (
            <div className="mt-4 md:mt-0">
              <Link
                to="/profile"
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                编辑资料
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* 标签页 */}
      <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'posts'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}>
          帖子 ({filteredUserPosts.length})
        </button>
        {isCurrentUser && (
          <>
            <button
              onClick={() => navigate('/collections')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              收藏
            </button>
            <button
              onClick={() => navigate('/following')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              关注
            </button>
            <button
              onClick={() => navigate('/followers')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              粉丝
            </button>
          </>
        )}
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {filteredUserPosts.length > 0 ? (
              filteredUserPosts.map((post: Post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState title="还没有发布过帖子" description="该用户还没有发布任何帖子" icon="📝" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
