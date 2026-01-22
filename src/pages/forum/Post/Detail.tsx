"use client"

import { favoriteApi, followApi, likeApi, messageApi, postApi } from "@/api"
import { Avatar, Button, ConfirmDialog, EmptyState, LoadingState, RichTextEditor } from "@/components"
import CommentItem from "@/components/composite/CommentItem"
import ShareButton from "@/components/composite/ShareButton"
import { useComments, useCreateComment } from "@/hooks/useComments"
import { usePost } from "@/hooks/usePosts"
import { Comment } from "@/types"
import { formatNumber, formatTime } from "@/utils/format"
import { stripHtml } from "@/utils/helpers"
import { sanitizeHtml } from "@/utils/sanitize"
import { useToast } from "@/utils/toast-hook"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
// import removed: useLikePost, useUnlikePost
import NotFoundPage from "@/pages/system/NotFound"
import { useAuthStore } from "@/store/useAuthStore"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Eye, MessageSquare, Star, ThumbsUp } from "lucide-react"

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
  // 收藏夹功能已简化为直接收藏/取消收藏

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
      const conversation = await messageApi.getOrCreateConversation({
        participantId: post.author.id,
      })
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
      setLocalIsLiked(res.action === "liked")
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
    try {
      const res = await favoriteApi.toggleFavorite(post.id)
      if (res.isFavorited) {
        showSuccess("已收藏该帖子")
      } else {
        showSuccess("已取消收藏")
      }
      // 刷新缓存并重新获取数据
      await queryClient.invalidateQueries({ queryKey: ["post", post.id] })
      await queryClient.invalidateQueries({ queryKey: ["posts"] })
      await refetchPost()
    } catch {
      showError("操作失败，请重试")
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
              <div className="p-6 sm:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {(post.isPinned || post.isHot) && (
                    <div className="flex items-center gap-2 mr-1">
                      {post.isPinned && (
                        <span className="flex items-center justify-center rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 shadow-sm ring-1 ring-red-100">
                          置顶
                        </span>
                      )}
                      {post.isHot && (
                        <span className="flex items-center justify-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 shadow-sm ring-1 ring-orange-100">
                          热门
                        </span>
                      )}
                    </div>
                  )}
                  {post.tags?.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>

                <h1 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl tracking-tight">
                  {post.title}
                </h1>

                <div className="flex flex-col gap-4 pb-8 mb-8 border-b border-gray-50 sm:flex-row sm:items-center sm:justify-between">
                  {post.author && (
                    <div className="flex items-center gap-4">
                      <Link to={`/users/${post.author.id}`} className="shrink-0">
                        <Avatar
                          src={post.author.avatar}
                          alt={post.author.username}
                          username={post.author.username}
                          size={52}
                          seed={post.author.id}
                          className="ring-2 ring-white shadow-sm"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/users/${post.author.id}`}
                            className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {post.author.username}
                          </Link>
                          {isAuthor && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                              楼主
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <span title={new Date(post.createdAt).toLocaleString()} className="cursor-help">
                            {formatTime(post.createdAt)}
                          </span>
                          <span className="h-3 w-px bg-gray-200"></span>
                          <span>发布于 校园论坛</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAuthor && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                      >
                        删除
                      </Button>
                    </div>
                  )}
                </div>

                {post.images && post.images.length > 0 && (
                  <div className="mb-8 space-y-4">
                    {post.images.map((img, index) => (
                      <img
                        key={img || index}
                        src={img}
                        alt={post.title}
                        loading="lazy"
                        className="w-full rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
                      />
                    ))}
                  </div>
                )}

                <div className="prose prose-lg max-w-none text-gray-800">
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-50 bg-white/80 px-6 py-4 backdrop-blur-md sm:-mx-8 sm:-mb-8 sm:px-8">
                <div className="flex flex-1 items-center justify-center gap-2 sm:justify-start">
                  {/* Main Actions Centered on Mobile, Left on Desktop effectively (or just flex start) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLike}
                      className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                        localIsLiked
                          ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsUp
                        className={`h-4 w-4 transition-transform group-hover:-rotate-12 ${
                          localIsLiked ? "fill-current" : ""
                        }`}
                      />
                      <span>{formatNumber(localLikes)} 赞</span>
                    </button>
                    {currentUser && (
                      <button
                        onClick={handleCollect}
                        className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                          localCollected
                            ? "bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 transition-transform group-hover:rotate-12 ${
                            localCollected ? "fill-current" : ""
                          }`}
                        />
                        <span>
                          {localCollected ? "已收藏" : "收藏"} {formatNumber(favoriteCount)}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="hidden h-4 w-px bg-gray-200 sm:block mx-2"></div>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5" title="评论数">
                      <MessageSquare className="h-4 w-4" />
                      {formatNumber(comments.length)}
                    </span>
                    <span className="flex items-center gap-1.5" title="阅读量">
                      <Eye className="h-4 w-4" />
                      {formatNumber(post.viewCount ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <ShareButton
                    url={`/posts/${post.id}`}
                    title={post.title}
                    description={stripHtml(post.content)}
                    className="rounded-full bg-gray-50 p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  />
                </div>
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
                  onChange={(val) => setCommentContent(val)}
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
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-400">关于作者</h4>
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
                      <div className="text-base font-semibold text-gray-900">{post.author.nickname}</div>
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
      </div>
    </div>
  )
}
