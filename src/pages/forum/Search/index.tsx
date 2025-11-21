import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PostCard, Avatar, EmptyState, LoadingState, Button, Card } from '@/components'
import { searchApi } from '@/api'
import { Post, User } from '@/types'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<'posts' | 'users'>('posts')
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'popular'>('latest')

  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 同步 URL 参数到本地状态
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams])

  // 搜索帖子和用户
  useEffect(() => {
    const searchAll = async () => {
      if (!query.trim()) {
        setPosts([])
        setUsers([])
        return
      }

      // 同时搜索帖子和用户
      setLoadingPosts(true)
      setLoadingUsers(true)

      try {
        const [postsRes, usersRes] = await Promise.all([
          searchApi.searchPosts({ q: query, page: 1, limit: 20 }).catch((err) => {
            console.error('搜索帖子失败:', err)
            return { data: [] }
          }),
          searchApi.searchUsers({ q: query, page: 1, limit: 20 }).catch((err) => {
            console.error('搜索用户失败:', err)
            return { data: [] }
          }),
        ])

        setPosts(postsRes.data as Post[])
        setUsers(usersRes.data as User[])
      } finally {
        setLoadingPosts(false)
        setLoadingUsers(false)
      }
    }

    searchAll()
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
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
                  curUsers.map((user) => (
                    <Card key={user.id} className="p-6 transition-shadow hover:shadow-md">
                      <Link to={`/users/${user.id}`} className="flex items-center gap-4">
                        <Avatar
                          src={user.avatar}
                          alt={user.username}
                          username={user.username}
                          size={48}
                          seed={user.id}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.username}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </Link>
                    </Card>
                  ))
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
