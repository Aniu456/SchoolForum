/**
 * 应用常量配置
 */

// ============================================
// 应用配置
// ============================================
export const APP_CONFIG = {
  name: '开放论坛',
  description: '公益性开放性论坛平台 - 服务所有用户群体',
  version: '1.0.0',
  author: 'Open Forum Team',
} as const;

// ============================================
// API 配置
// ============================================
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:30000',
  timeout: 30000,
  retryTimes: 3,
  retryDelay: 1000,
} as const;

// ============================================
// 分页配置
// ============================================
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// ============================================
// 缓存配置
// ============================================
export const CACHE_CONFIG = {
  // React Query 缓存时间（毫秒）
  staleTime: {
    short: 1000 * 60 * 2,      // 2分钟
    medium: 1000 * 60 * 5,     // 5分钟
    long: 1000 * 60 * 10,      // 10分钟
    veryLong: 1000 * 60 * 30,  // 30分钟
  },
  // LocalStorage 键名
  keys: {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    user: 'user',
    drafts: 'drafts',
  },
} as const;

// ============================================
// 路由路径
// ============================================
export const ROUTES = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  search: '/search',

  // 帖子
  posts: '/posts',
  postNew: '/posts/new',
  postDetail: (id: string) => `/posts/${id}`,
  postEdit: (id: string) => `/posts/${id}/edit`,

  // 用户
  profile: '/profile',
  userDetail: (id: string) => `/users/${id}`,
  connections: '/connections',

  // 通知和收藏
  notifications: '/notifications',
  favorites: '/favorites',
  favoriteDetail: (id: string) => `/favorites/folders/${id}`,

  // 私信
  messages: '/messages',
  chat: (conversationId: string) => `/messages/${conversationId}`,

  // 服务中心
  services: '/services',
  marketplace: '/marketplace',
} as const;

// ============================================
// 文件上传配置
// ============================================
export const UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// ============================================
// 验证规则
// ============================================
export const VALIDATION = {
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    minLength: 6,
    maxLength: 50,
  },
  title: {
    minLength: 5,
    maxLength: 100,
  },
  content: {
    minLength: 10,
    maxLength: 10000,
  },
  comment: {
    minLength: 1,
    maxLength: 500,
  },
} as const;

// ============================================
// WebSocket 配置
// ============================================
export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:30000',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
} as const;

// ============================================
// 通知轮询配置
// ============================================
export const NOTIFICATION_CONFIG = {
  pollInterval: 60000, // 60秒
  maxUnreadDisplay: 99,
} as const;

// ============================================
// Toast 配置
// ============================================
export const TOAST_CONFIG = {
  duration: 3000,
  position: 'top-right' as const,
} as const;

