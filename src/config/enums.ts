/**
 * 应用枚举常量
 * 集中管理所有枚举类型，提供类型安全和代码提示
 */

// ============================================
// 用户相关
// ============================================
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

// ============================================
// 帖子相关
// ============================================
export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VIEW_COUNT = 'viewCount',
  LIKE_COUNT = 'likeCount',
  COMMENT_COUNT = 'commentCount',
}

// ============================================
// 通知相关
// ============================================
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  FOLLOW = 'FOLLOW',
  SYSTEM = 'SYSTEM',
  MENTION = 'MENTION',
}

// ============================================
// 举报相关
// ============================================
export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISINFORMATION = 'MISINFORMATION',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

// ============================================
// 二手交易
// ============================================
export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  REMOVED = 'REMOVED',
}

export enum ItemCategory {
  ELECTRONICS = 'ELECTRONICS',
  BOOKS = 'BOOKS',
  CLOTHING = 'CLOTHING',
  FURNITURE = 'FURNITURE',
  SPORTS = 'SPORTS',
  STATIONERY = 'STATIONERY',
  DAILY = 'DAILY',
  OTHER = 'OTHER',
}

export enum ItemCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum TradeMethod {
  MEET = 'MEET',
  DELIVERY = 'DELIVERY',
  BOTH = 'BOTH',
}

// ============================================
// 学习资源
// ============================================
export enum ResourceType {
  COURSE_NOTES = 'COURSE_NOTES',
  EXAM_MATERIALS = 'EXAM_MATERIALS',
  TEXTBOOK = 'TEXTBOOK',
  VIDEO = 'VIDEO',
  SOFTWARE = 'SOFTWARE',
  TEMPLATE = 'TEMPLATE',
  OTHER = 'OTHER',
}

export enum ResourceStatus {
  PUBLISHED = 'PUBLISHED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  REMOVED = 'REMOVED',
}

export enum SubjectCategory {
  COMPUTER_SCIENCE = 'COMPUTER_SCIENCE',
  MATHEMATICS = 'MATHEMATICS',
  PHYSICS = 'PHYSICS',
  CHEMISTRY = 'CHEMISTRY',
  BIOLOGY = 'BIOLOGY',
  ENGLISH = 'ENGLISH',
  CHINESE = 'CHINESE',
  HISTORY = 'HISTORY',
  GEOGRAPHY = 'GEOGRAPHY',
  POLITICS = 'POLITICS',
  ECONOMICS = 'ECONOMICS',
  ARTS = 'ARTS',
  OTHER = 'OTHER',
}

// ============================================
// 社团招新
// ============================================
export enum ClubType {
  ACADEMIC = 'ACADEMIC',
  SPORTS = 'SPORTS',
  ARTS = 'ARTS',
  TECHNOLOGY = 'TECHNOLOGY',
  VOLUNTEER = 'VOLUNTEER',
  CULTURAL = 'CULTURAL',
  ENTREPRENEURSHIP = 'ENTREPRENEURSHIP',
  OTHER = 'OTHER',
}

export enum RecruitmentStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ENDED = 'ENDED',
}

// ============================================
// 失物招领
// ============================================
export enum LostFoundType {
  LOST = 'LOST',
  FOUND = 'FOUND',
}

export enum LostFoundCategory {
  ELECTRONICS = 'ELECTRONICS',
  DOCUMENTS = 'DOCUMENTS',
  KEYS = 'KEYS',
  CARDS = 'CARDS',
  BAGS = 'BAGS',
  CLOTHING = 'CLOTHING',
  BOOKS = 'BOOKS',
  ACCESSORIES = 'ACCESSORIES',
  OTHER = 'OTHER',
}

export enum LostFoundStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  CLOSED = 'CLOSED',
}

// ============================================
// 拼车拼单
// ============================================
export enum CarpoolType {
  CARPOOL = 'CARPOOL',
  FOOD_ORDER = 'FOOD_ORDER',
  SHOPPING = 'SHOPPING',
  TICKET = 'TICKET',
  OTHER = 'OTHER',
}

export enum CarpoolStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  COMPLETED = 'COMPLETED',
}

// ============================================
// 公告优先级
// ============================================
export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

