// 统一导出所有 API 模块
export * from './social/user';
export * from './content/post';
export * from './content/comment';
export * from './social/like';
export * from './social/favorite';
export * from './social/notification';
export * from './content/search';
export * from './content/recommendation';
export * from './content/announcement';

// 新功能模块
export { authApi } from './social/auth';
export { uploadApi } from './content/upload';
export { draftApi } from './content/draft';
export { default as marketplaceApi } from './services/marketplace';
export { studyResourceApi } from './services/studyResource';
export { default as messageApi } from './services/message';
export { default as activityApi } from './services/activity';
export { default as followApi } from './social/follow';

// 积分、算法、服务中心、系统监控
export { pointsApi } from './social/points';
export { algorithmsApi } from './content/algorithms';
export { serviceCenterApi } from './services/serviceCenter';
export { healthApi } from './system/health';

export {
    api,
    default as apiClient,
    type PaginatedResponse,
    type AlternatePaginatedResponse,
    type PaginationMeta,
} from './core/client';
