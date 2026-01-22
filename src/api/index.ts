// ============================================
// 统一导出所有 API 模块
// ============================================

// 核心类型和客户端
export {
  api,
  default as apiClient,
  type AlternatePaginatedResponse,
  type PaginatedResponse,
  type PaginationMeta,
} from "./core/client"

// ============================================
// 内容模块 (Content)
// ============================================
export * from "./content/algorithms" // algorithmsApi
export * from "./content/announcement" // announcementApi
export * from "./content/comment" // commentApi
export * from "./content/draft" // draftApi
export * from "./content/post" // postApi
export * from "./content/recommendation" // recommendationApi
export * from "./content/search" // searchApi
export { uploadApi } from "./content/upload"

// ============================================
// 社交模块 (Social)
// ============================================
export * from "./social/favorite" // favoriteApi
export * from "./social/like" // likeApi
export * from "./social/notification" // notificationApi
export { pointsApi } from "./social/points" // 已废弃
export * from "./social/user" // authApi, userApi, followApi

// ============================================
// 功能模块 (Services)
// ============================================
export { default as activityApi } from "./services/activity"
export { secondhandApi } from "./services/marketplace"
export { default as messageApi } from "./services/message"
export { studyResourcesApi } from "./services/study-resources"

// ============================================
// 系统模块 (System)
// ============================================
export { healthApi } from "./system/health"
