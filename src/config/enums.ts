/**
 * 应用枚举常量
 * 集中管理所有枚举类型，提供类型安全和代码提示
 */

// ============================================
// 用户相关
// ============================================
export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// ============================================
// 帖子相关
// ============================================
export enum PostStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
}

export enum PostSortBy {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  VIEW_COUNT = "viewCount",
  LIKE_COUNT = "likeCount",
  COMMENT_COUNT = "commentCount",
}

// ============================================
// 通知相关
// ============================================
export enum NotificationType {
  COMMENT = "COMMENT",
  REPLY = "REPLY",
  LIKE = "LIKE",
  SYSTEM = "SYSTEM",
  NEW_POST = "NEW_POST",
  NEW_FOLLOWER = "NEW_FOLLOWER",
}

// ============================================
// 二手交易
// ============================================
export enum ItemStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
  REMOVED = "REMOVED",
}

export enum ItemCategory {
  ELECTRONICS = "ELECTRONICS",
  BOOKS = "BOOKS",
  CLOTHING = "CLOTHING",
  FURNITURE = "FURNITURE",
  SPORTS = "SPORTS",
  STATIONERY = "STATIONERY",
  DAILY = "DAILY",
  OTHER = "OTHER",
}

export enum ItemCondition {
  NEW = "NEW",
  LIKE_NEW = "LIKE_NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export enum TradeMethod {
  MEET = "MEET",
  DELIVERY = "DELIVERY",
  BOTH = "BOTH",
}

// ============================================
// 公告类型
// ============================================
export enum AnnouncementType {
  INFO = "INFO",
  WARNING = "WARNING",
  URGENT = "URGENT",
}

// ============================================
// 公告优先级
// ============================================
export enum AnnouncementPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// ============================================
// 验证码类型
// ============================================
export enum VerificationCodeType {
  REGISTER = "REGISTER",
  RESET_PASSWORD = "RESET_PASSWORD",
  CHANGE_EMAIL = "CHANGE_EMAIL",
}

// ============================================
// 会话类型
// ============================================
export enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}
