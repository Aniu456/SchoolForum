'use client'

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, ConfirmDialog, EmptyState, LoadingState, RichTextEditor, Button } from '@/components'
import { formatTime } from '@/utils/format'
import { stripHtml } from '@/utils/helpers'
import { Comment } from '@/types'
import { useToast } from '@/utils/toast-hook'
import { likeApi, favoriteApi, followApi, messageApi } from '@/api'
import { usePost } from '@/hooks/usePosts'
import { useComments, useCreateComment } from '@/hooks/useComments'
// import removed: useLikePost, useUnlikePost
import { useAuthStore } from '@/store/useAuthStore'
import NotFoundPage from '@/pages/system/NotFound'
import { useQueryClient } from '@tanstack/react-query'

// 评论组件（支持嵌套回复）
function CommentItem({
  comment,
  onReply,
  depth = 0,
}: {
  comment: Comment
  onReply: (commentId: string, username: string) => void
  depth?: number
}) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likes, setLikes] = useState(comment.likes)
  const { showError } = useToast()

  const handleLike = async () => {
    try {
      const res = await likeApi.toggleLike({ targetId: comment.id, targetType: 'COMMENT' })
      const nextLiked = res.isLiked
      const nextCount = res.likeCount
      setIsLiked(nextLiked)
      setLikes(nextCount)
    } catch {
      showError('操作失败，请重试')
    }
  }

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-gray-200 pl-4 dark:border-gray-700' : ''}>
      <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-start gap-3">
          {comment.author && (
            <Avatar
              src={comment.author.avatar}
              alt={comment.author.username}
              username={comment.author.username}
              size={40}
              seed={comment.author.id}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {comment.author && (
                <Link
                  to={`/users/${comment.author.id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                  {comment.author.username}
                </Link>
              )}
              {comment.replyTo && (
                <>
                  <span className="text-gray-400">回复</span>
                  <Link
                    to={`/users/${comment.replyTo.id}`}
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {comment.replyTo.username}
                  </Link>
                </>
              )}
              <span>· {formatTime(comment.createdAt)}</span>
            </div>
            <div
              className="prose prose-sm mt-1 max-w-none wrap-break-word text-gray-700 dark:prose-invert dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-500 transition hover:text-blue-600 dark:hover:text-blue-300">
                <span>👍</span>
                <span>{likes}</span>
              </button>
              {comment.author && (
                <button
                  onClick={() => {
                    onReply(comment.id, comment.author!.username)
                    setTimeout(() => {
                      const commentInput = document.querySelector('[data-comment-input]')
                      if (commentInput) {
                        commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 100)
                  }}
                  className="text-blue-600 hover:underline dark:text-blue-400">
                  回复
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 嵌套回复 - 不限制层级 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { user: currentUser } = useAuthStore()
  const { data: post, isLoading: postLoading, error: postError, refetch: refetchPost } = usePost(id ?? '')
  const { data: commentsData, isLoading: commentsLoading } = useComments(id ?? '')
  const queryClient = useQueryClient()
  const comments = Array.isArray(commentsData) ? commentsData : commentsData?.data || []
  const createCommentMutation = useCreateComment()
  // API 对接后改用 likesApi.toggle；保留 hooks 引用以兼容类型，但不使用

  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFavoriteDialog, setShowFavoriteDialog] = useState(false)
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [favoriteNote, setFavoriteNote] = useState('')

  // 使用 post 数据直接计算状态
  const baseIsLiked = post?.isLikedByMe ?? post?.isLiked ?? false
  const baseLikes = post?.likeCount ?? 0
  const baseCollected = post?.isFavorited ?? false
  const baseCollectedCount = post?.collectedCount ?? 0

  // 本地状态用于乐观更新
  const [localIsLiked, setLocalIsLiked] = useState(baseIsLiked)
  const [localLikes, setLocalLikes] = useState(baseLikes)
  const [localCollected, setLocalCollected] = useState(baseCollected)
  const [favoriteCount, setFavoriteCount] = useState(baseCollectedCount)
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null)

  // 同步 post 数据到本地状态（用于乐观更新）
  useEffect(() => {
    if (post) {
      setLocalIsLiked(post.isLikedByMe ?? post.isLiked ?? false)
      setLocalLikes(post.likeCount ?? 0)
      setLocalCollected(post.isFavorited ?? false)
      setFavoriteCount(post.collectedCount ?? 0)
      setFavoriteRecordId(null)
    }
  }, [post, currentUser?.id])

  // 检查关注状态
  useEffect(() => {
    const authorId = post?.author?.id
    const userId = currentUser?.id

    if (!authorId || !userId || authorId === userId) {
      setIsFollowingAuthor(false)
      return
    }

    followApi
      .checkFollowing(authorId)
      .then((res) => setIsFollowingAuthor(!!res.isFollowing))
      .catch(() => setIsFollowingAuthor(false))
  }, [post?.author?.id, currentUser?.id])

  if (!id) {
    return <NotFoundPage />
  }

  if (postLoading) {
    return <LoadingState message="加载帖子中..." />
  }

  if (postError || !post) {
    // 判断错误类型
    const is404 = postError?.message?.includes('404') || postError?.message?.includes('不存在') || !post
    const isNetworkError = postError?.message?.includes('网络') || postError?.message?.includes('Network') || postError?.message?.includes('timeout')
    const isPermissionError = postError?.message?.includes('403') || postError?.message?.includes('权限')

    let errorType: 'error' | 'not-found' | 'network-error' | 'permission-denied' = 'error'
    let errorTitle = '加载失败'
    let errorDescription = postError?.message || '帖子不存在'

    if (is404) {
      errorType = 'not-found'
      errorTitle = '帖子不存在'
      errorDescription = '该帖子可能已被删除或不存在'
    } else if (isNetworkError) {
      errorType = 'network-error'
      errorTitle = '网络连接失败'
      errorDescription = '无法连接到服务器，请检查网络后重试'
    } else if (isPermissionError) {
      errorType = 'permission-denied'
      errorTitle = '无权访问'
      errorDescription = '您没有权限查看此帖子'
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          type={errorType}
          title={errorTitle}
          description={errorDescription}
          action={{
            label: '重新加载',
            onClick: () => refetchPost(),
          }}
          showHomeButton={true}
        />
      </div>
    )
  }

  const isAuthor = currentUser && post.author && post.author.id === currentUser.id

  const handleFollowAuthor = async () => {
    if (!currentUser) {
      showError('请先登录')
      return
    }
    if (!post.author?.id || isAuthor) return

    try {
      if (isFollowingAuthor) {
        await followApi.unfollowUser(post.author.id)
        showSuccess('已取消关注')
      } else {
        await followApi.followUser(post.author.id)
        showSuccess('已关注作者')
      }

      // 刷新缓存
      await queryClient.invalidateQueries({ queryKey: ['user', post.author.id] })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['followers'] })
      await queryClient.invalidateQueries({ queryKey: ['following'] })

      // 重新检查关注状态，确保与后端同步
      const { isFollowing } = await followApi.checkFollowing(post.author.id)
      setIsFollowingAuthor(isFollowing)
    } catch (error: any) {
      console.error('关注操作错误:', error)

      // 检查错误信息的多个可能位置
      const errorMessage = error?.message || error?.response?.data?.message || error?.data?.message || ''

      // 如果是已经关注的错误，重新检查状态
      if (errorMessage.includes('已经关注') || errorMessage.includes('已关注')) {
        showSuccess('已关注')
        await queryClient.invalidateQueries({ queryKey: ['user', post.author.id] })
        const { isFollowing } = await followApi.checkFollowing(post.author.id)
        setIsFollowingAuthor(isFollowing)
      } else if (errorMessage.includes('未关注') || errorMessage.includes('未找到关注')) {
        showSuccess('已取消关注')
        await queryClient.invalidateQueries({ queryKey: ['user', post.author.id] })
        const { isFollowing } = await followApi.checkFollowing(post.author.id)
        setIsFollowingAuthor(isFollowing)
      } else {
        showError(`关注操作失败：${errorMessage || '请稍后再试'}`)
      }
    }
  }

  const handleMessageAuthor = async () => {
    if (!currentUser) {
      showError('请先登录')
      return
    }
    if (!post.author?.id || isAuthor) return

    try {
      const conversation = await messageApi.getOrCreateConversation({ participantId: post.author.id })
      navigate(`/messages/${conversation.id}`)
    } catch {
      showError('打开私信失败，请重试')
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      showError('请先登录')
      return
    }

    try {
      const res = await likeApi.toggleLike({ targetId: post.id, targetType: 'POST' })
      setLocalIsLiked(res.isLiked)
      setLocalLikes(res.likeCount)
      // 刷新缓存并重新获取数据
      await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      await refetchPost()
    } catch {
      showError('操作失败，请重试')
    }
  }

  const handleCollect = async () => {
    if (!currentUser) {
      showError('请先登录')
      return
    }
    if (localCollected && favoriteRecordId) {
      try {
        await favoriteApi.deleteFavorite(favoriteRecordId)
        showSuccess('已取消收藏')
        // 刷新缓存并重新获取数据
        await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
        await queryClient.invalidateQueries({ queryKey: ['posts'] })
        await refetchPost()
      } catch {
        showError('取消收藏失败，请重试')
      }
      return
    }
    if (localCollected) {
      showSuccess('已收藏该帖子')
      return
    }
    try {
      const res = await favoriteApi.getFolders(1, 100)
      const folderList = (res as any)?.data || []
      if (!folderList || folderList.length === 0) {
        const created = await favoriteApi.createFolder({ name: '默认收藏夹' })
        await favoriteApi.createFavorite({ postId: post.id, folderId: created.id })
        showSuccess('已加入默认收藏夹')
        // 刷新缓存并重新获取数据
        await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
        await queryClient.invalidateQueries({ queryKey: ['posts'] })
        await refetchPost()
        return
      }
      setFolders(folderList)
      setSelectedFolderId(folderList[0]?.id || '')
      setShowFavoriteDialog(true)
    } catch {
      showError('加载收藏夹失败，请重试')
    }
  }

  const confirmAddFavorite = async () => {
    if (!selectedFolderId) {
      showError('请选择收藏夹')
      return
    }
    try {
      await favoriteApi.createFavorite({ postId: post.id, folderId: selectedFolderId, note: favoriteNote || undefined })
      setShowFavoriteDialog(false)
      setFavoriteNote('')
      showSuccess('已加入收藏')
      // 刷新缓存并重新获取数据
      await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      await refetchPost()
    } catch {
      showError('收藏失败，请重试')
    }
  }

  const handleComment = async () => {
    if (!currentUser) {
      showError('请先登录')
      return
    }

    // 去除HTML标签后检查内容是否为空
    const textContent = commentContent.replace(/<[^>]*>/g, '').trim()
    if (!textContent) {
      showError('评论内容不能为空')
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        content: commentContent,
        postId: post.id,
        parentId: replyTo?.id,
      })

      setCommentContent('')
      setReplyTo(null)

      showSuccess('评论发布成功')
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch {
      showError('评论发布失败，请重试')
    }
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username })
  }

  const handleEdit = () => {
    navigate(`/posts/${id}/edit`)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    // 模拟删除
    showSuccess('帖子已删除')
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 帖子内容 */}
      <article className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
        {/* 标签和分类 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {post.isPinned && <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">置顶</span>}
            {post.isHot && <span className="rounded bg-orange-500 px-2 py-1 text-xs text-white">热门</span>}
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-red-300 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20">
                删除
              </button>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h1>

        {/* 作者信息 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-800">
          {post.author && (
            <div className="flex items-center gap-4">
              <Link to={`/users/${post.author.id}`}>
                <Avatar
                  src={post.author.avatar}
                  alt={post.author.username}
                  username={post.author.username}
                  size={48}
                  seed={post.author.id}
                />
              </Link>
              <div>
                <Link
                  to={`/users/${post.author.id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                  {post.author.username}
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatTime(post.createdAt)}</div>
              </div>
            </div>
          )}
          {!isAuthor && post.author && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollowAuthor}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${isFollowingAuthor
                  ? 'border border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-600 dark:bg-green-900/30 dark:text-green-200'
                  : 'border border-blue-500 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-400 dark:bg-blue-500'
                  }`}>
                {isFollowingAuthor ? '已关注' : '关注'}
              </button>
              <button
                onClick={handleMessageAuthor}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                私信
              </button>
            </div>
          )}
        </div>

        {/* 封面/图片 */}
        {post.images && post.images.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <img
              src={post.images[0]}
              alt={post.title}
              className="w-full rounded-2xl object-cover"
            />
            {post.images.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(1).map((img) => (
                  <img key={img} src={img} alt={post.title} className="h-32 w-full rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="mb-6 prose prose-gray dark:prose-invert max-w-none">
          <div
            className="whitespace-pre-wrap text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 md:grid-cols-4">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${localIsLiked
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
              }`}>
            赞 {localLikes}
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            评论 {comments.length}
          </button>
          {currentUser && (
            <button
              onClick={handleCollect}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${localCollected
                ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
                }`}>
              ⭐ 收藏 {favoriteCount}
            </button>
          )}
          <button className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            浏览 {post.viewCount}
          </button>
          <div className="md:col-span-2">
            <ShareButton url={`/posts/${post.id}`} title={post.title} description={stripHtml(post.content)} />
          </div>
        </div>
      </article>

      {/* 评论区域 */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">评论 ({comments.length})</h2>

        {/* 发表评论 */}
        <div className="mb-8" data-comment-input>
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              <span>回复 {replyTo.username}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-auto text-blue-600 hover:underline dark:text-blue-400">
                取消
              </button>
            </div>
          )}
          <RichTextEditor
            content={commentContent}
            onChange={setCommentContent}
            placeholder={replyTo ? `回复 ${replyTo.username}...` : '写下你的评论...'}
            className="min-h-[150px]"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {commentContent.replace(/<[^>]*>/g, '').length} 字符
            </p>
            <button
              onClick={handleComment}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              {replyTo ? '回复' : '发布评论'}
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <div>
          {commentsLoading ? (
            <LoadingState message="加载评论中..." size="sm" />
          ) : comments.length > 0 ? (
            (comments as Comment[])
              .filter((c: Comment) => !c.parentId)
              .map((comment: Comment) => <CommentItem key={comment.id} comment={comment} onReply={handleReply} />)
          ) : (
            <div className="py-12">
              <EmptyState title="暂无评论" description="快来抢沙发，发表第一个评论吧！" icon="💬" />
            </div>
          )}
        </div>
      </div>

      {/* 相关帖子 - 暂时隐藏，等待 API 支持 */}
      {/* <RelatedPosts currentPostId={id} posts={[]} category={post.category} tags={post.tags} /> */}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="删除帖子"
        description="确定要删除这篇帖子吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />

      {/* 收藏夹选择对话框 */}
      <ConfirmDialog
        isOpen={showFavoriteDialog}
        onClose={() => setShowFavoriteDialog(false)}
        onConfirm={confirmAddFavorite}
        title="加入收藏夹"
        confirmText="加入"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选择收藏夹</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">备注（可选）</label>
            <input
              type="text"
              value={favoriteNote}
              onChange={(e) => setFavoriteNote(e.target.value)}
              placeholder="例如：课程参考、考试复习..."
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}

function ShareButton({ url, title, description }: { url: string; title: string; description?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      weibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    }
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    } else if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl })
      } catch (err) {
        console.error('分享失败:', err)
      }
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        分享
      </Button>
      <ConfirmDialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="分享帖子" onConfirm={() => setIsOpen(false)} confirmText="关闭">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">链接地址</label>
            <div className="mt-2 flex gap-2">
              <input type="text" value={shareUrl} readOnly className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
              <Button variant="primary" size="sm" onClick={handleCopy}>{copied ? '已复制' : '复制'}</Button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">分享到</label>
            <div className="flex gap-2">
              <Button onClick={() => handleShare('twitter')} className="flex-1 bg-blue-400 hover:bg-blue-500">Twitter</Button>
              <Button onClick={() => handleShare('facebook')} className="flex-1 bg-blue-600 hover:bg-blue-700">Facebook</Button>
              <Button onClick={() => handleShare('weibo')} className="flex-1 bg-red-500 hover:bg-red-600">微博</Button>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  )
}
