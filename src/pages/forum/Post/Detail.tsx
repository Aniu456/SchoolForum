"use client"

import { favoriteApi, followApi, likeApi, messageApi, postApi, uploadApi } from "@/api"
import { Avatar, Button, ConfirmDialog, EmptyState, LazyImage, LoadingState, RichTextEditor } from "@/components"
import CommentItem from "@/components/composite/CommentItem"
import ShareButton from "@/components/composite/ShareButton"
import { useComments, useCreateComment } from "@/hooks/useComments"
import { usePost } from "@/hooks/usePosts"
import { Comment } from "@/types"
import { formatNumber, formatTime } from "@/utils/format"
import { stripHtml } from "@/utils/helpers"
import { sanitizeHtml } from "@/utils/sanitize"
import { useToast } from "@/utils/toast-hook"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
// import removed: useLikePost, useUnlikePost
import NotFoundPage from "@/pages/system/NotFound"
import { useAuthStore } from "@/store/useAuthStore"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Eye, ImageIcon, MessageSquare, Star, ThumbsUp } from "lucide-react"

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { user: currentUser } = useAuthStore()
  const { data: post, isLoading: postLoading, error: postError, refetch: refetchPost } = usePost(id ?? "")
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useComments(id ?? "", {
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    previewLimit: 3,
  })
  const queryClient = useQueryClient()
  
  // 构建评论树形结构：将扁平列表转换为嵌套结构
  const buildCommentTree = (comments: Comment[]): (Comment & { replies?: Comment[] })[] => {
    if (!comments || comments.length === 0) return []
    
    const commentMap = new Map<string, Comment & { replies?: Comment[] }>()
    const rootComments: (Comment & { replies?: Comment[] })[] = []
    
    // 第一遍：创建所有评论的映射，保留已有的 replies
    comments.forEach((comment) => {
      commentMap.set(comment.id, { 
        ...comment, 
        replies: (comment as any).replies || [] 
      })
    })
    
    // 第二遍：构建树形结构
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parentId) {
        // 这是回复，添加到父评论的 replies 中
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          if (!parent.replies) {
            parent.replies = []
          }
          // 避免重复添加
          if (!parent.replies.find((r: Comment) => r.id === comment.id)) {
            parent.replies.push(commentWithReplies)
          }
        }
      } else {
        // 这是根评论
        rootComments.push(commentWithReplies)
      }
    })
    
    // 对每个评论的 replies 进行排序（按创建时间）
    const sortReplies = (comment: Comment & { replies?: Comment[] }) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        comment.replies.forEach(sortReplies)
      }
    }
    rootComments.forEach(sortReplies)
    
    return rootComments
  }
  
  // 如果后端已经返回了嵌套结构，直接使用；否则构建树形结构
  const comments = useMemo(() => {
    const allComments = Array.isArray(commentsData) ? commentsData : commentsData?.data || []
    
    if (!allComments || allComments.length === 0) return []
    
    // 检查是否已经有嵌套结构（检查第一个评论是否有 replies 属性）
    const hasNestedStructure = allComments.some((c: Comment) => 
      (c as any).replies !== undefined && Array.isArray((c as any).replies)
    )
    
    if (hasNestedStructure) {
      // 后端已经返回了嵌套结构，只返回根评论
      return allComments.filter((c: Comment) => !c.parentId)
    } else {
      // 构建树形结构
      return buildCommentTree(allComments)
    }
  }, [commentsData, buildCommentTree])
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
  const [_favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null)

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

  // 图片轮播状态（必须在所有 early return 之前声明）
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const images = post?.images ?? []
  const prevImage = useCallback(() =>
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const nextImage = useCallback(() =>
    setCurrentImageIndex((i) => (i + 1) % images.length), [images.length])

  // 键盘控制 lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
      if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightboxOpen, prevImage, nextImage])

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
      setLocalLikes(res.likeCount ?? localLikes)
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
      
      // 立即刷新评论列表，确保新评论/回复立即可见
      // 先使缓存失效
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] })
      queryClient.invalidateQueries({ queryKey: ["post", post.id] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      
      // 然后立即刷新评论列表
      if (refetchComments) {
        await refetchComments()
      }
      
      // 如果是回复，滚动到对应的评论位置
      if (replyTo?.id) {
        setTimeout(() => {
          const commentElement = document.querySelector(`[data-comment-id="${replyTo.id}"]`)
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 500)
      }
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
    } catch {
      showError("删除帖子失败，请稍后重试")
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑 */}
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-400">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-medium text-gray-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <span>/</span>
          <span>帖子详情</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* ── 主内容 ── */}
          <div className="space-y-5 min-w-0">
            <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="p-6 sm:p-8">
                {/* 标签行 */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {post.isPinned && (
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 ring-1 ring-red-100">
                      置顶
                    </span>
                  )}
                  {post.isHot && (
                    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-500 ring-1 ring-orange-100">
                      🔥 热门
                    </span>
                  )}
                  {post.tags?.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>

                {/* 标题 */}
                <h1 className="mb-5 text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
                  {post.title}
                </h1>

                {/* 作者信息行 */}
                <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-gray-100">
                  {post.author && (
                    <div className="flex items-center gap-3">
                      <Link to={`/users/${post.author.id}`} className="shrink-0">
                        <Avatar
                          src={post.author.avatar}
                          alt={post.author.username}
                          username={post.author.username}
                          size={44}
                          seed={post.author.id}
                          className="ring-2 ring-white shadow-sm"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/users/${post.author.id}`}
                            className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {post.author.nickname || post.author.username}
                          </Link>
                          {isAuthor && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                              楼主
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                          <span title={new Date(post.createdAt).toLocaleString()} className="cursor-help">
                            {formatTime(post.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(post.viewCount ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {isAuthor && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="ghost" size="sm" onClick={handleEdit}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 text-xs">
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDelete}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs">
                        删除
                      </Button>
                    </div>
                  )}
                </div>

                {/* 图片轮播 */}
                {images.length > 0 && (
                  <div className="mb-6">
                    <div className="relative overflow-hidden rounded-xl bg-gray-100">
                      {/* 主图 */}
                      <div
                        className="relative cursor-zoom-in"
                        onClick={() => setLightboxOpen(true)}
                      >
                        <LazyImage
                          src={images[currentImageIndex]}
                          alt={`${post.title} - 图片 ${currentImageIndex + 1}`}
                          aspectRatio="16/9"
                          objectFit="contain"
                          className="w-full"
                          containerClassName="w-full max-h-[480px]"
                          showLoadingSpinner={true}
                        />
                        {/* 计数角标 */}
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </div>

                      {/* 左右切换 */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                          >
                            ‹
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {/* 缩略图条 */}
                    {images.length > 1 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={`shrink-0 h-14 w-14 overflow-hidden rounded-lg ring-2 transition-all ${
                              i === currentImageIndex
                                ? "ring-blue-500 opacity-100"
                                : "ring-transparent opacity-60 hover:opacity-90"
                            }`}
                          >
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 正文 */}
                <div
                  className="prose prose-base max-w-none text-gray-800 leading-relaxed
                    [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4
                    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:text-gray-600
                    [&_a]:text-blue-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                />
              </div>

              {/* 底部操作栏 */}
              <div className="flex items-center justify-between gap-3 border-t border-gray-50 bg-gray-50/50 px-6 py-3 sm:px-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                      localIsLiked
                        ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                        : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300"
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${localIsLiked ? "fill-current" : ""}`} />
                    <span>{formatNumber(localLikes)}</span>
                  </button>

                  {currentUser && (
                    <button
                      onClick={handleCollect}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                        localCollected
                          ? "bg-amber-50 text-amber-500 ring-1 ring-amber-100"
                          : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${localCollected ? "fill-current" : ""}`} />
                      <span>{localCollected ? "已收藏" : "收藏"}</span>
                    </button>
                  )}

                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {formatNumber(post.commentCount ?? comments.length)} 评论
                  </span>
                </div>

                <ShareButton
                  url={`/posts/${post.id}`}
                  title={post.title}
                  description={stripHtml(post.content)}
                  className="rounded-full bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 hover:text-blue-600 transition-colors"
                />
              </div>
            </article>

            {/* 评论区 */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 sm:px-8">
                <h2 className="text-base font-bold text-gray-900">评论</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
                  {post.commentCount ?? comments.length}
                </span>
              </div>

              {/* 编辑器区 */}
              <div className="px-6 py-5 sm:px-8" data-comment-input>
                {/* 当前用户头像 + 编辑器横排 */}
                <div className="flex gap-3">
                  {currentUser && (
                    <div className="shrink-0 mt-1">
                      <Avatar
                        src={currentUser.avatar}
                        alt={currentUser.username}
                        username={currentUser.username}
                        size={36}
                        seed={currentUser.id}
                        className="ring-2 ring-white shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {replyTo && (
                      <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm">
                        <span className="flex-1 text-blue-700 text-xs">
                          回复 <span className="font-semibold">@{replyTo.username}</span>
                        </span>
                        <button
                          onClick={() => setReplyTo(null)}
                          className="shrink-0 rounded px-1.5 py-0.5 text-xs text-blue-400 hover:bg-blue-100 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    )}
                    <RichTextEditor
                      content={commentContent}
                      onChange={(val) => setCommentContent(val)}
                      placeholder={replyTo ? `回复 @${replyTo.username}...` : "写下你的评论，支持插入图片..."}
                      compact
                      onUploadImage={async (file) => {
                        const res = await uploadApi.uploadImage(file)
                        return res.url
                      }}
                    />
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {commentContent.replace(/<[^>]*>/g, "").trim().length} 字
                      </span>
                      <Button
                        size="sm"
                        onClick={handleComment}
                        disabled={createCommentMutation.isPending}
                        className="rounded-full px-5 text-sm"
                      >
                        {createCommentMutation.isPending ? "发布中..." : replyTo ? "发布回复" : "发布评论"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 评论列表 */}
              <div className="border-t border-gray-100">
                {commentsLoading ? (
                  <div className="px-6 py-8 sm:px-8">
                    <LoadingState message="加载评论中..." size="sm" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="divide-y divide-gray-50 px-6 sm:px-8">
                    {(comments as Comment[])
                      .filter((c: Comment) => !c.parentId)
                      .map((comment: Comment) => (
                        <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
                      ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 sm:px-8">
                    <EmptyState title="暂无评论" description="快来抢沙发，发表第一个评论吧！" icon="💬" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 侧边栏 ── */}
          <aside className="space-y-4 lg:sticky lg:top-20 self-start">
            {/* 作者卡片 */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">关于作者</p>
              {post.author && (
                <>
                  <div className="flex items-center gap-3">
                    <Link to={`/users/${post.author.id}`}>
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
                      <Link
                        to={`/users/${post.author.id}`}
                        className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.author.nickname || post.author.username}
                      </Link>
                      <p className="text-xs text-gray-400">活跃用户</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 rounded-xl bg-gray-50 py-3 text-center">
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatNumber(post.viewCount ?? 0)}</div>
                      <div className="text-[11px] text-gray-400">阅读</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatNumber(localLikes)}</div>
                      <div className="text-[11px] text-gray-400">获赞</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {formatNumber(post.commentCount ?? comments.length)}
                      </div>
                      <div className="text-[11px] text-gray-400">评论</div>
                    </div>
                  </div>

                  {!isAuthor && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        fullWidth
                        size="sm"
                        variant={isFollowingAuthor ? "outline" : "primary"}
                        onClick={handleFollowAuthor}
                      >
                        {isFollowingAuthor ? "已关注" : "关注"}
                      </Button>
                      <Button fullWidth size="sm" variant="outline" onClick={handleMessageAuthor}>
                        私信
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 帖子信息卡片 */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 text-sm space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">帖子信息</p>
              <div className="flex items-center justify-between text-gray-500">
                <span>发布时间</span>
                <span className="text-gray-700 font-medium">{formatTime(post.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>阅读量</span>
                <span className="text-gray-700 font-medium">{formatNumber(post.viewCount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>点赞</span>
                <span className="text-gray-700 font-medium">{formatNumber(localLikes)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>收藏</span>
                <span className="text-gray-700 font-medium">{formatNumber(favoriteCount)}</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Lightbox */}
        {lightboxOpen && images.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl"
              onClick={() => setLightboxOpen(false)}
            >
              ×
            </button>
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-2xl"
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                >
                  ‹
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-2xl"
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                >
                  ›
                </button>
              </>
            )}
            <img
              src={images[currentImageIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}

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
