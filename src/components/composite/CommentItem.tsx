"use client"

import { commentApi, likeApi } from "@/api"
import { Avatar } from "@/components"
import { Comment } from "@/types"
import { formatTime } from "@/utils/format"
import { sanitizeHtml } from "@/utils/sanitize"
import { useToast } from "@/utils/toast-hook"
import { cn } from "@/utils/helpers"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

interface ExtendedComment extends Comment {
  replies?: Comment[]
  replyCount?: number
  hasMoreReplies?: boolean
  isLiked?: boolean
  likes?: number
}

interface CommentItemProps {
  comment: ExtendedComment
  onReply: (commentId: string, username: string) => void
  depth?: number
}

// ── 内联 SVG 图标 ──────────────────────────────────────────
const LikeIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const SpinnerIcon = () => (
  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
)
// ──────────────────────────────────────────────────────────

function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likes, setLikes] = useState(comment.likes ?? comment.likeCount ?? 0)
  const [replies, setReplies] = useState<Comment[] | undefined>(comment.replies)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false)
  const [repliesExpanded, setRepliesExpanded] = useState(true)
  const { showError } = useToast()

  const replyCount =
    typeof comment.replyCount === "number" ? comment.replyCount : (replies?.length ?? 0)

  useEffect(() => {
    if (comment.replies !== undefined) {
      setReplies(comment.replies)
      setHasLoadedReplies(true)
    }
  }, [comment.replies])

  const handleLike = async () => {
    try {
      const res = await likeApi.toggleLike({ targetId: comment.id, targetType: "COMMENT" })
      setIsLiked(res.action === "liked")
      setLikes(res.likeCount)
    } catch {
      showError("操作失败，请重试")
    }
  }

  const handleLoadReplies = async () => {
    if (loadingReplies) return
    if (hasLoadedReplies) { setRepliesExpanded((v) => !v); return }
    setLoadingReplies(true)
    try {
      const res = await commentApi.getReplies(comment.id, 1, 20)
      const all = (res as any)?.data || (res as any)?.items || []
      if (Array.isArray(all)) {
        const map = new Map<string, Comment & { replies?: Comment[] }>()
        const roots: Comment[] = []
        all.forEach((r: Comment) => map.set(r.id, { ...r, replies: (r as any).replies || [] }))
        all.forEach((r: Comment) => {
          const node = map.get(r.id)!
          if (r.parentId && r.parentId !== comment.id) {
            const parent = map.get(r.parentId)
            if (parent) { if (!parent.replies) parent.replies = []; parent.replies.push(node) }
          } else roots.push(node)
        })
        setReplies(roots)
        setHasLoadedReplies(true)
        setRepliesExpanded(true)
      }
    } catch { showError("加载回复失败，请重试") }
    finally { setLoadingReplies(false) }
  }

  const handleReplyClick = () => {
    onReply(comment.id, comment.author?.nickname || comment.author?.username || "")
    setTimeout(() => {
      const el = document.querySelector("[data-comment-input]")
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  const hasReplies = (replies && replies.length > 0) || replyCount > 0
  const showExpandBtn =
    depth === 0 && hasReplies &&
    (hasLoadedReplies ? (replies?.length ?? 0) > 0 : replyCount > 0 || comment.hasMoreReplies)

  // ── 根评论 ──────────────────────────────────────────────
  if (depth === 0) {
    return (
      <div data-comment-id={comment.id} className="py-5">
        {/* 主体行 */}
        <div className="flex gap-3">
          {/* 头像 */}
          <div className="shrink-0 flex flex-col items-center">
            <Link to={`/users/${comment.author?.id ?? ""}`}>
              <Avatar
                src={comment.author?.avatar}
                alt={comment.author?.nickname || comment.author?.username || ""}
                username={comment.author?.username || ""}
                size={38}
                seed={comment.author?.id}
                className="ring-2 ring-white shadow-sm"
              />
            </Link>
            {/* 竖线连接回复 */}
            {replies && replies.length > 0 && repliesExpanded && (
              <div className="mt-2 w-px flex-1 bg-gray-200 min-h-[8px]" />
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0 pb-1">
            {/* 作者 + 时间 */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <Link
                to={`/users/${comment.author?.id ?? ""}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {comment.author?.nickname || comment.author?.username}
              </Link>
              {comment.replyTo && (
                <span className="text-xs text-gray-400">
                  回复{" "}
                  <Link to={`/users/${comment.replyTo.id}`} className="text-blue-500 hover:underline">
                    @{(comment.replyTo as any).nickname || (comment.replyTo as any).username}
                  </Link>
                </span>
              )}
              <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
            </div>

            {/* 正文 */}
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed
                [&_p]:my-0.5
                [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-h-60 [&_img]:object-contain
                [&_blockquote]:my-2 [&_blockquote]:border-l-[3px] [&_blockquote]:border-blue-200
                [&_blockquote]:bg-blue-50/60 [&_blockquote]:pl-3 [&_blockquote]:pr-2 [&_blockquote]:py-1
                [&_blockquote]:rounded-r-lg [&_blockquote]:text-gray-500 [&_blockquote]:not-italic"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content) }}
            />

            {/* 操作行 */}
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                  isLiked
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                <LikeIcon filled={isLiked} />
                <span>{likes > 0 ? likes : "赞"}</span>
              </button>

              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-all"
              >
                <ReplyIcon />
                <span>回复</span>
              </button>

              {showExpandBtn && (
                <button
                  onClick={handleLoadReplies}
                  disabled={loadingReplies}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 ml-0.5"
                >
                  {loadingReplies ? (
                    <><SpinnerIcon /><span>加载中</span></>
                  ) : repliesExpanded && hasLoadedReplies ? (
                    <><ChevronUpIcon /><span>收起</span></>
                  ) : (
                    <><ChevronDownIcon /><span>{replyCount > 0 ? `${replyCount} 条回复` : "展开回复"}</span></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 嵌套回复区 */}
        {replies && replies.length > 0 && repliesExpanded && (
          <div className="ml-[50px] mt-2 rounded-xl bg-gray-50 overflow-hidden">
            {replies.map((reply, idx) => (
              <div
                key={reply.id}
                className={cn(idx > 0 && "border-t border-gray-100")}
              >
                <CommentItem
                  comment={reply as ExtendedComment}
                  onReply={onReply}
                  depth={1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 嵌套回复（depth > 0）──────────────────────────────
  return (
    <div data-comment-id={comment.id} className="flex gap-2.5 px-4 py-3">
      <Link to={`/users/${comment.author?.id ?? ""}`} className="shrink-0 mt-0.5">
        <Avatar
          src={comment.author?.avatar}
          alt={comment.author?.nickname || comment.author?.username || ""}
          username={comment.author?.username || ""}
          size={28}
          seed={comment.author?.id}
          className="ring-2 ring-white shadow-sm"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <Link
            to={`/users/${comment.author?.id ?? ""}`}
            className="text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors"
          >
            {comment.author?.nickname || comment.author?.username}
          </Link>
          {comment.replyTo && (
            <span className="text-xs text-gray-400">
              回复{" "}
              <Link to={`/users/${comment.replyTo.id}`} className="text-blue-500 hover:underline">
                @{(comment.replyTo as any).nickname || (comment.replyTo as any).username}
              </Link>
            </span>
          )}
          <span className="text-[11px] text-gray-400">{formatTime(comment.createdAt)}</span>
        </div>

        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[13px]
            [&_p]:my-0 [&_img]:rounded-md [&_img]:my-1 [&_img]:max-h-40 [&_img]:object-contain"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content) }}
        />

        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all",
              isLiked ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <LikeIcon filled={isLiked} />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button
            onClick={handleReplyClick}
            className="rounded-full px-2 py-0.5 text-xs font-medium text-gray-400 hover:text-blue-600 transition-all"
          >
            回复
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(CommentItem)
