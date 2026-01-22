"use client"

import { commentApi, likeApi } from "@/api"
import { Avatar, Button } from "@/components"
import { Comment } from "@/types"
import { formatTime } from "@/utils/format"
import { sanitizeHtml } from "@/utils/sanitize"
import { useToast } from "@/utils/toast-hook"
import { ThumbsUp } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

// 扩展Comment类型以支持前端计算字段
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

function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likes, setLikes] = useState(comment.likes ?? comment.likeCount ?? 0)
  const [replies, setReplies] = useState<Comment[] | undefined>(comment.replies)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const { showError } = useToast()
  const replyCount = typeof comment.replyCount === "number" ? comment.replyCount : (replies?.length ?? 0)

  // 当父级传入的 comment.replies 变化时，同步到本地 replies 状态
  useEffect(() => {
    setReplies(comment.replies)
  }, [comment.replies])

  const handleLike = async () => {
    try {
      const res = await likeApi.toggleLike({ targetId: comment.id, targetType: "COMMENT" })
      const nextLiked = res.action === "liked"
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
    <div
      className={depth > 0 ? "mt-4 ml-2 pl-4 border-l-2 border-gray-100" : "py-6 border-b border-gray-50 last:border-0"}
    >
      <div className="group relative">
        <div className="flex items-start gap-3">
          {comment.author && (
            <Avatar
              src={comment.author.avatar}
              alt={comment.author.nickname || comment.author.username}
              username={comment.author.username}
              size={40}
              seed={comment.author.id}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {comment.author && (
                <Link to={`/users/${comment.author.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                  {comment.author.nickname || comment.author.username}
                </Link>
              )}
              {comment.replyTo && (
                <>
                  <span className="text-gray-400">回复</span>
                  <Link to={`/users/${comment.replyTo.id}`} className="font-semibold text-blue-600 hover:underline">
                    {(comment.replyTo as any).nickname || (comment.replyTo as any).username}
                  </Link>
                </>
              )}
              <span>· {formatTime(comment.createdAt)}</span>
            </div>
            <div
              className="prose prose-sm mt-1 max-w-none wrap-break-word text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content) }}
            />
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-8 gap-1.5 px-2 ${
                  isLiked ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                <span>{likes || "赞"}</span>
              </Button>
              {comment.author && (
                <button
                  onClick={() => {
                    onReply(comment.id, comment.author!.nickname || comment.author!.username)
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
            <CommentItem key={reply.id} comment={reply as ExtendedComment} onReply={onReply} depth={depth + 1} />
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

export default React.memo(CommentItem)
