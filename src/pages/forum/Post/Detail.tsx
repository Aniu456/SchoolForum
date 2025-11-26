"use client"

import { commentApi, favoriteApi, followApi, likeApi, messageApi, postApi } from "@/api"
import { Avatar, Button, ConfirmDialog, EmptyState, LoadingState, RichTextEditor } from "@/components"
import { useComments, useCreateComment } from "@/hooks/useComments"
import { usePost } from "@/hooks/usePosts"
import { Comment } from "@/types"
import { formatNumber, formatTime } from "@/utils/format"
import { stripHtml } from "@/utils/helpers"
import { useToast } from "@/utils/toast-hook"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
// import removed: useLikePost, useUnlikePost
import NotFoundPage from "@/pages/system/NotFound"
import { useAuthStore } from "@/store/useAuthStore"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Eye, MessageSquare, Share2, Star, ThumbsUp } from "lucide-react"

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
  const [likes, setLikes] = useState(comment.likes ?? comment.likeCount ?? 0)
  const [replies, setReplies] = useState<Comment[] | undefined>(comment.replies)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const { showError } = useToast()
  const replyCount = typeof comment.replyCount === "number" ? comment.replyCount : replies?.length ?? 0

  // 当父级传入的 comment.replies 变化时，同步到本地 replies 状态
  useEffect(() => {
    setReplies(comment.replies)
  }, [comment.replies])

  const handleLike = async () => {
    try {
      const res = await likeApi.toggleLike({ targetId: comment.id, targetType: "COMMENT" })
      const nextLiked = res.isLiked
      const nextCount = res.likeCount
      setIsLiked(nextLiked)
      setLikes(nextCount)
    } catch {
      showError("操作失败，请重试")
    }
  }

  const handleLoadMoreReplies = async () => {
    if (loadingReplies) return
    setLoadingReplies(true)
    try {
      const res = await commentApi.getReplies(comment.id, 1, 20)
      const all = (res as any)?.data || []
      if (Array.isArray(all)) {
        setReplies(all as Comment[])
      }
    } catch {
      showError("加载回复失败，请重试")
    } finally {
      setLoadingReplies(false)
    }
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l border-gray-200 pl-4" : ""}>
      <div className="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm">
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {comment.author && (
                <Link to={`/users/${comment.author.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                  {comment.author.username}
                </Link>
              )}
              {comment.replyTo && (
                <>
                  <span className="text-gray-400">回复</span>
                  <Link to={`/users/${comment.replyTo.id}`} className="font-semibold text-blue-600 hover:underline">
                    {comment.replyTo.username}
                  </Link>
                </>
              )}
              <span>· {formatTime(comment.createdAt)}</span>
            </div>
            <div
              className="prose prose-sm mt-1 max-w-none wrap-break-word text-gray-700"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-500 transition hover:text-blue-600"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{likes}</span>
              </button>
              {comment.author && (
                <button
                  onClick={() => {
                    onReply(comment.id, comment.author!.username)
                    setTimeout(() => {
                      const commentInput = document.querySelector("[data-comment-input]")
                      if (commentInput) {
                        commentInput.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }, 100)
                  }}
                  className="text-blue-600 hover:underline"
                >
                  回复
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 嵌套回复 - 不限制层级 */}
      {replies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
      {((typeof comment.hasMoreReplies === "boolean" && comment.hasMoreReplies) ||
        replyCount > (replies?.length ?? 0)) && (
        <div className="mt-2 pl-12 text-sm">
          <button
            onClick={handleLoadMoreReplies}
            className="text-blue-600 hover:underline disabled:text-gray-400"
            disabled={loadingReplies}
          >
            {loadingReplies
              ? "加载回复中..."
              : `查看更多回复${typeof comment.replyCount === "number" ? `（共 ${comment.replyCount} 条）` : ""}`}
          </button>
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
  const { data: post, isLoading: postLoading, error: postError, refetch: refetchPost } = usePost(id ?? "")
  const { data: commentsData, isLoading: commentsLoading } = useComments(id ?? "", {
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    previewLimit: 3,
  })
  const queryClient = useQueryClient()
  const comments = Array.isArray(commentsData) ? commentsData : commentsData?.data || []
  const createCommentMutation = useCreateComment()
  // API 对接后改用 likesApi.toggle；保留 hooks 引用以兼容类型，但不使用

  const [commentContent, setCommentContent] = useState("")
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFavoriteDialog, setShowFavoriteDialog] = useState(false)
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState("")
  const [favoriteNote, setFavoriteNote] = useState("")

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
    const is404 = postError?.message?.includes("404") || postError?.message?.includes("不存在") || !post
    const isNetworkError =
      postError?.message?.includes("网络") ||
      postError?.message?.includes("Network") ||
      postError?.message?.includes("timeout")
    const isPermissionError = postError?.message?.includes("403") || postError?.message?.includes("权限")

    let errorType: "error" | "not-found" | "network-error" | "permission-denied" = "error"
    let errorTitle = "加载失败"
    let errorDescription = postError?.message || "帖子不存在"

    if (is404) {
      errorType = "not-found"
      errorTitle = "帖子不存在"
      errorDescription = "该帖子可能已被删除或不存在"
    } else if (isNetworkError) {
      errorType = "network-error"
      errorTitle = "网络连接失败"
      errorDescription = "无法连接到服务器，请检查网络后重试"
    } else if (isPermissionError) {
      errorType = "permission-denied"
      errorTitle = "无权访问"
      errorDescription = "您没有权限查看此帖子"
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          type={errorType}
          title={errorTitle}
          description={errorDescription}
          action={{
            label: "重新加载",
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
      showError("请先登录")
      return
    }
    if (!post.author?.id || isAuthor) return

    try {
      if (isFollowingAuthor) {
        await followApi.unfollowUser(post.author.id)
        showSuccess("已取消关注")
      } else {
        await followApi.followUser(post.author.id)
        showSuccess("已关注作者")
      }

      // 刷新缓存
      await queryClient.invalidateQueries({ queryKey: ["user", post.author.id] })
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      await queryClient.invalidateQueries({ queryKey: ["followers"] })
      await queryClient.invalidateQueries({ queryKey: ["following"] })

      // 重新检查关注状态，确保与后端同步
      const { isFollowing } = await followApi.checkFollowing(post.author.id)
      setIsFollowingAuthor(isFollowing)
    } catch (error: any) {
      console.error("关注操作错误:", error)

      // 检查错误信息的多个可能位置
      const errorMessage = error?.message || error?.response?.data?.message || error?.data?.message || ""

      // 如果是已经关注的错误，重新检查状态
      if (errorMessage.includes("已经关注") || errorMessage.includes("已关注")) {
        showSuccess("已关注")
        await queryClient.invalidateQueries({ queryKey: ["user", post.author.id] })
        const { isFollowing } = await followApi.checkFollowing(post.author.id)
        setIsFollowingAuthor(isFollowing)
      } else if (errorMessage.includes("未关注") || errorMessage.includes("未找到关注")) {
        showSuccess("已取消关注")
        await queryClient.invalidateQueries({ queryKey: ["user", post.author.id] })
        const { isFollowing } = await followApi.checkFollowing(post.author.id)
        setIsFollowingAuthor(isFollowing)
      } else {
        showError(`关注操作失败：${errorMessage || "请稍后再试"}`)
      }
    }
  }

  const handleMessageAuthor = async () => {
    if (!currentUser) {
      showError("请先登录")
      return
    }
    if (!post.author?.id || isAuthor) return

    try {
      const conversation = await messageApi.getOrCreateConversation({ participantId: post.author.id })
      navigate(`/messages/${conversation.id}`)
    } catch {
      showError("打开私信失败，请重试")
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      showError("请先登录")
      return
    }

    try {
      const res = await likeApi.toggleLike({ targetId: post.id, targetType: "POST" })
      setLocalIsLiked(res.isLiked)
      setLocalLikes(res.likeCount)
      // 刷新缓存并重新获取数据
      await queryClient.invalidateQueries({ queryKey: ["post", post.id] })
      await queryClient.invalidateQueries({ queryKey: ["posts"] })
      await refetchPost()
    } catch {
      showError("操作失败，请重试")
    }
  }

  const handleCollect = async () => {
    if (!currentUser) {
      showError("请先登录")
      return
    }
    if (localCollected && favoriteRecordId) {
      try {
        await favoriteApi.deleteFavorite(favoriteRecordId)
        showSuccess("已取消收藏")
        // 刷新缓存并重新获取数据
        await queryClient.invalidateQueries({ queryKey: ["post", post.id] })
        await queryClient.invalidateQueries({ queryKey: ["posts"] })
        await refetchPost()
      } catch {
        showError("取消收藏失败，请重试")
      }
      return
    }
    if (localCollected) {
      showSuccess("已收藏该帖子")
      return
    }
    try {
      const res = await favoriteApi.getFolders(1, 100)
      const folderList = (res as any)?.data || []
      if (!folderList || folderList.length === 0) {
        const created = await favoriteApi.createFolder({ name: "默认收藏夹" })
        await favoriteApi.createFavorite({ postId: post.id, folderId: created.id })
        showSuccess("已加入默认收藏夹")
        // 刷新缓存并重新获取数据
        await queryClient.invalidateQueries({ queryKey: ["post", post.id] })
        await queryClient.invalidateQueries({ queryKey: ["posts"] })
        await refetchPost()
        return
      }
      setFolders(folderList)
      setSelectedFolderId(folderList[0]?.id || "")
      setShowFavoriteDialog(true)
    } catch {
      showError("加载收藏夹失败，请重试")
    }
  }

  const confirmAddFavorite = async () => {
    if (!selectedFolderId) {
      showError("请选择收藏夹")
      return
    }
    try {
      await favoriteApi.createFavorite({ postId: post.id, folderId: selectedFolderId, note: favoriteNote || undefined })
      setShowFavoriteDialog(false)
      setFavoriteNote("")
      showSuccess("已加入收藏")
      // 刷新缓存并重新获取数据
      await queryClient.invalidateQueries({ queryKey: ["post", post.id] })
      await queryClient.invalidateQueries({ queryKey: ["posts"] })
      await refetchPost()
    } catch {
      showError("收藏失败，请重试")
    }
  }

  const handleComment = async () => {
    if (!currentUser) {
      showError("请先登录")
      return
    }

    // 去除HTML标签后检查内容是否为空
    const textContent = commentContent.replace(/<[^>]*>/g, "").trim()
    if (!textContent) {
      showError("评论内容不能为空")
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        content: commentContent,
        postId: post.id,
        parentId: replyTo?.id,
      })

      setCommentContent("")
      setReplyTo(null)

      showSuccess("评论发布成功")
      // 显式刷新评论列表，确保新评论/回复立即可见
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] })
      queryClient.invalidateQueries({ queryKey: ["post", post.id] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    } catch {
      showError("评论发布失败，请重试")
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

  const confirmDelete = async () => {
    if (!id) return
    try {
      await postApi.deletePost(id)
      // 删除成功后，使帖子列表缓存失效，确保首页刷新数据
      await queryClient.invalidateQueries({ queryKey: ["posts"] })
      showSuccess("帖子已删除")
      navigate("/")
    } catch (error) {
      showError("删除帖子失败，请稍后重试")
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </button>
          <span>/</span>
          <span className="text-gray-400">帖子详情</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_0.9fr]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {post.isPinned && (
                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">置顶</span>
                  )}
                  {post.isHot && (
                    <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-500">热门</span>
                  )}
                  {post.tags?.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>

                <h1 className="mb-4 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">{post.title}</h1>

                <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  {post.author && (
                    <div className="flex items-center gap-3">
                      <Link to={`/users/${post.author.id}`}>
                        <Avatar
                          src={post.author.avatar}
                          alt={post.author.username}
                          username={post.author.username}
                          size={56}
                          seed={post.author.id}
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/users/${post.author.id}`}
                            className="text-base font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {post.author.username}
                          </Link>
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            楼主
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{formatTime(post.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatNumber(post.viewCount ?? 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {formatNumber(post.commentCount ?? comments.length)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAuthor && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                      >
                        删除
                      </Button>
                    </div>
                  )}
                </div>

                {post.images && post.images.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {post.images.map((img, index) => (
                      <img key={img || index} src={img} alt={post.title} className="w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                )}

                <div className="prose prose-lg max-w-none text-gray-800">
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      localIsLiked ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{formatNumber(localLikes)} 赞</span>
                  </button>
                  {currentUser && (
                    <button
                      onClick={handleCollect}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        localCollected
                          ? "bg-amber-100 text-amber-700 shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      <span>
                        {localCollected ? "已收藏" : "收藏"} {formatNumber(favoriteCount)}
                      </span>
                    </button>
                  )}
                  <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                    <MessageSquare className="h-4 w-4" />
                    {formatNumber(comments.length)}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                    <Eye className="h-4 w-4" />
                    {formatNumber(post.viewCount ?? 0)}
                  </div>
                </div>
                <ShareButton url={`/posts/${post.id}`} title={post.title} description={stripHtml(post.content)} />
              </div>
            </article>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">评论 ({post.commentCount ?? comments.length})</h2>
              </div>

              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-4" data-comment-input>
                {replyTo && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <span>回复 {replyTo.username}</span>
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-blue-600 hover:underline">
                      取消
                    </button>
                  </div>
                )}
                <RichTextEditor
                  content={commentContent}
                  onChange={setCommentContent}
                  placeholder={replyTo ? `回复 ${replyTo.username}...` : "写下你的评论..."}
                  className="min-h-[150px] bg-white"
                />
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{commentContent.replace(/<[^>]*>/g, "").length} 字符</p>
                  <Button size="sm" onClick={handleComment} className="rounded-full px-5">
                    {replyTo ? "回复" : "发布评论"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {commentsLoading ? (
                  <LoadingState message="加载评论中..." size="sm" />
                ) : comments.length > 0 ? (
                  (comments as Comment[])
                    .filter((c: Comment) => !c.parentId)
                    .map((comment: Comment) => <CommentItem key={comment.id} comment={comment} onReply={handleReply} />)
                ) : (
                  <div className="py-10">
                    <EmptyState title="暂无评论" description="快来抢沙发，发表第一个评论吧！" icon="💬" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-400">About Author</h4>
              <div className="mt-3 flex items-center gap-3">
                {post.author && (
                  <>
                    <Avatar
                      src={post.author.avatar}
                      alt={post.author.username}
                      username={post.author.username}
                      size={56}
                      seed={post.author.id}
                    />
                    <div>
                      <div className="text-base font-semibold text-gray-900">{post.author.username}</div>
                      <div className="text-xs text-gray-500">活跃用户</div>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(post.viewCount ?? 0)}</div>
                  <div className="text-xs text-gray-500">阅读</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(localLikes)}</div>
                  <div className="text-xs text-gray-500">获赞</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatNumber(post.commentCount ?? comments.length)}
                  </div>
                  <div className="text-xs text-gray-500">评论</div>
                </div>
              </div>
              {!isAuthor && post.author && (
                <div className="mt-4 flex gap-2">
                  <Button fullWidth variant={isFollowingAuthor ? "outline" : "primary"} onClick={handleFollowAuthor}>
                    {isFollowingAuthor ? "已关注" : "关注作者"}
                  </Button>
                  <Button fullWidth variant="outline" onClick={handleMessageAuthor}>
                    私信
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>

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
              <label className="block text-sm font-medium text-gray-700">选择收藏夹</label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">备注（可选）</label>
              <input
                type="text"
                value={favoriteNote}
                onChange={(e) => setFavoriteNote(e.target.value)}
                placeholder="例如：课程参考、考试复习..."
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </ConfirmDialog>
      </div>
    </div>
  )
}

function ShareButton({
  url,
  title,
  description,
  className,
}: {
  url: string
  title: string
  description?: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== "undefined" ? window.location.origin + url : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      weibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(
        shareUrl,
      )}`,
    }
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400")
    } else if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl })
      } catch (err) {
        console.error("分享失败:", err)
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className || ""}`}
      >
        <Share2 className="h-5 w-5" />
        分享
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="分享帖子"
        onConfirm={() => setIsOpen(false)}
        confirmText="关闭"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">链接地址</label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <Button variant="primary" size="sm" onClick={handleCopy}>
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">分享到</label>
            <div className="flex gap-2">
              <Button onClick={() => handleShare("twitter")} className="flex-1 bg-blue-400 hover:bg-blue-500">
                Twitter
              </Button>
              <Button onClick={() => handleShare("facebook")} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Facebook
              </Button>
              <Button onClick={() => handleShare("weibo")} className="flex-1 bg-red-500 hover:bg-red-600">
                微博
              </Button>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  )
}
