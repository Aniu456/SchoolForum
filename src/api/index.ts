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
export { default as marketplaceApi } from './services/marketplace';
export { default as messageApi } from './services/message';
export { default as activityApi } from './services/activity';
export { default as followApi } from './social/follow';

export {
    api,
    default as apiClient,
    type PaginatedResponse,
    type AlternatePaginatedResponse,
    type PaginationMeta,
} from './core/client';
