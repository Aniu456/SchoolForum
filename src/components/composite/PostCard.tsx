import { Link } from 'react-router-dom'
import Avatar from '../base/Avatar'
import { Post } from '@/types'
import { formatTime, formatNumber } from '@/utils/format'
import { stripHtml } from '@/utils/helpers'

interface PostCardProps {
  post: Post;
  onTagClick?: (tag: string) => void;
  variant?: 'default' | 'glass';
}

export default function PostCard({ post, onTagClick, variant = 'default' }: PostCardProps) {
  // 提取纯文本内容用于预览
  const contentPreview = stripHtml(post.content)
  const isPinned = post.isPinned ?? false

  const wrapperClass =
    variant === 'glass'
      ? `relative block overflow-hidden rounded-[30px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.18)] ring-1 ring-white/60 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-[0_40px_110px_rgba(0,0,0,0.24)] dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60`
      : `relative block rounded-lg border bg-white p-6 transition-shadow hover:shadow-md dark:bg-gray-900 ${isPinned
        ? 'border-amber-300 ring-1 ring-amber-200 shadow-sm dark:border-amber-700 dark:ring-amber-700/60'
        : 'border-gray-200 dark:border-gray-800'
      }`

  return (
    <Link
      to={`/posts/${post.id}`}
      className={wrapperClass}>
      {variant === 'default' && isPinned && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500" />}
      {variant === 'glass' && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-br from-white/60 via-white/20 to-white/0 opacity-90" />
          <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.5),transparent_40%)]" />
        </>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 标题和标签 */}
          <div className="mb-2 flex items-center gap-2">
            {post.isPinned && <span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">置顶</span>}
            {post.isHot && <span className="rounded bg-orange-500 px-2 py-0.5 text-xs text-white">热门</span>}
            {post.category && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {typeof post.category === 'string' ? post.category : post.category.name}
              </span>
            )}
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{post.title}</h3>

          {/* 内容预览 */}
          <p className="mb-4 line-clamp-2 text-gray-600 dark:text-gray-400">{contentPreview}</p>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) =>
                onTagClick ? (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.preventDefault()
                      onTagClick(String(tag))
                    }}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300">
                    #{tag}
                  </button>
                ) : (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    #{tag}
                  </span>
                ),
              )}
            </div>
          )}

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {post.author && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={post.author.avatar}
                  alt={post.author.username}
                  username={post.author.username}
                  size={24}
                  seed={post.author.id}
                />
                <span>{post.author.username}</span>
              </div>
            )}
            {post.author && <span>·</span>}
            <span>{formatTime(post.createdAt)}</span>
            <span>·</span>
            <span>浏览 {formatNumber(post.views ?? post.viewCount ?? 0)}</span>
            <span>·</span>
            <span>👍 {formatNumber(post.likes ?? post.likeCount ?? 0)}</span>
            <span>·</span>
            <span>💬 {formatNumber(post.comments ?? post.commentCount ?? 0)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
