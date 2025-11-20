// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  bio?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  points?: number;
  level?: number;
}

// 帖子类型
export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isHot?: boolean;
  isLiked?: boolean;
  isCollected?: boolean;
  collectedCount?: number;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string; // 支持回复评论
  likes: number;
  createdAt: string;
  replies?: Comment[];
  isLiked?: boolean;
  replyTo?: User; // 回复的目标用户
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  postCount: number;
}

// 论坛统计数据
export interface ForumStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  onlineUsers: number;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention';
  from: User;
  to: string; // 用户ID
  postId?: string;
  commentId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// 关注关系
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// 收藏
export interface Collection {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

// 排序类型
export type SortType = 'latest' | 'hot' | 'popular' | 'trending';

