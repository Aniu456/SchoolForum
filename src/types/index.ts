// ============================================
// 导出新功能模块类型
// ============================================
export * from './marketplace';
export * from './message';
export * from './activity';

// ============================================
// 用户相关类型
// ============================================
export interface User {
  id: string;
  username: string;
  email?: string; // 某些接口不返回 email
  nickname: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
  // 统计信息（某些接口返回）
  _count?: {
    posts: number;
    comments: number;
    likes: number;
  };
  // 兼容旧代码的字段
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  followersCount?: number; // 别名
  followers?: number; // 别名
  following?: number; // 别名
  points?: number; // 积分（已废弃，但保留兼容）
  level?: number; // 等级（已废弃，但保留兼容）
}

// ============================================
// 帖子相关类型
// ============================================

// 帖子状态（内容审核）
export type PostStatus = 'PUBLISHED' | 'PENDING' | 'REJECTED' | 'DRAFT';

export interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  viewCount: number;
  status?: PostStatus; // 审核状态
  isAnonymous?: boolean; // 是否匿名发帖
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    role?: string;
  };
  likeCount: number;
  commentCount: number;
  isLikedByMe?: boolean; // 仅在带登录态时返回
  isLiked?: boolean; // 别名，兼容旧代码
  isDeleted?: boolean;
  deletedAt?: string;
  // 兼容旧代码的字段
  views?: number; // 别名 viewCount
  likes?: number; // 别名 likeCount
  comments?: number; // 别名 commentCount
  isPinned?: boolean; // 置顶标记
  isHot?: boolean; // 热门标记
  category?: string | { id: string; name: string }; // 分类（已废弃，但保留兼容）
  categoryId?: string; // 分类ID（已废弃，但保留兼容）
  collectedCount?: number; // 收藏数
  isFavorited?: boolean; // 是否已收藏
}

// ============================================
// 评论相关类型
// ============================================
export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  parentId?: string;
  likeCount: number;
  replyCount?: number;
  replies?: Comment[]; // 嵌套回复
  createdAt: string;
  updatedAt: string;
  // 前端状态
  isLiked?: boolean;
  likes?: number;
  replyTo?: {
    id: string;
    username: string;
  };
}

// ============================================
// 通知类型
// ============================================
export type NotificationType = 'COMMENT' | 'REPLY' | 'LIKE' | 'SYSTEM' | 'FOLLOW' | 'MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// 公告类型
// ============================================
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 请求 DTO 类型（兼容旧代码）
// ============================================

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  studentId?: string;
  nickname?: string;
  confirmPassword?: string; // 前端验证用
}

// 登录响应
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// 忘记密码请求
export interface ForgotPasswordRequest {
  email: string;
}

// 重置密码请求
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword?: string; // 前端验证用
}

// 验证重置令牌请求
export interface VerifyResetTokenRequest {
  token: string;
}

// 创建帖子请求
export interface CreatePostRequest {
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
}

// 更新帖子请求
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
}

// 创建评论请求
export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentId?: string;
}

// 更新用户资料请求
export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatar?: string;
}

// ============================================
// 分页相关类型
// ============================================

// 分页查询参数（根据 API.md 规范）
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// 帖子查询参数
export interface PostQueryParams extends PaginationParams {
  sortBy?: 'createdAt' | 'viewCount' | string; // 允许 string 以兼容旧代码
  tag?: string;
  authorId?: string;
  keyword?: string;
  q?: string; // 搜索关键词（别名）
}

// 分页响应类型（API.md 标准格式）
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount?: number;
  };
}

// ============================================
// 其他类型
// ============================================

// 排序类型
export type SortType = 'latest' | 'popular' | 'trending' | 'most_commented';

// 更新用户请求
export interface UpdateUserRequest {
  nickname?: string;
  bio?: string;
  avatar?: string;
}

// 统计数据
export interface Stats {
  postsCount?: number;
  usersCount?: number;
  commentsCount?: number;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
}

// ============================================
// 兼容旧代码的类型别名
// ============================================
export type { User as UserType };
export type { Post as PostType };
export type { Comment as CommentType };
