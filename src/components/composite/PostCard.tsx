import { Link } from 'react-router-dom'
import Avatar from '../base/Avatar'
import { Post } from '@/types'
import { formatTime, formatNumber } from '@/utils/format'
import { stripHtml } from '@/utils/helpers'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  // 提取纯文本内容用于预览
  const contentPreview = stripHtml(post.content)

  return (
    <Link
      to={`/posts/${post.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
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
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  #{tag}
                </span>
              ))}
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
