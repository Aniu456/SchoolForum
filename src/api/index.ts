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
export * from './core/admin';

// 新功能模块
export { default as marketplaceApi } from './services/marketplace';
export { default as resourcesApi } from './services/resources';
export { default as clubsApi } from './services/clubs';
export { default as lostfoundApi } from './services/lostfound';
export { default as carpoolApi } from './services/carpool';
export { default as followApi } from './social/follow';
export { default as reportApi } from './content/report';

export {
    api,
    default as apiClient,
    type PaginatedResponse,
    type AlternatePaginatedResponse,
    type PaginationMeta,
} from './core/client';
