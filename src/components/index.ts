// ============================================
// 基础组件
// ============================================
export { default as Avatar } from './base/Avatar';
export { default as Footer } from './base/Footer';
export { default as InfiniteScroll } from './base/InfiniteScroll';
export { default as Navbar } from './base/Navbar';
export { default as PostCard } from './composite/PostCard';
export { default as RichTextEditor } from './composite/RichTextEditor';


// ============================================
// 对话框组件
// ============================================
export { ConfirmDialog, ReportDialog } from './composite/Dialogs';

// ============================================
// 错误边界
// ============================================
export { ErrorBoundary } from './base/ErrorBoundary';

// ============================================
// 布局工具
// ============================================
// ============================================
// Providers
// ============================================
export * from './providers/QueryProvider';

// ============================================
// 布局组件
// ============================================
export * from './layouts';

// ============================================
// UI 组件库（优先使用这些组件）
// ============================================
export * from './ui';

// ============================================
// 通用组件
// ============================================
export * from './common';

// ============================================
// 路由守卫
// ============================================
export * from './guards';

// ============================================
// 兼容性导出（逐步废弃）
// ============================================
// 旧的 Button/Card/Modal 已移到 ui/ 文件夹
// 旧的 LoadingState 已重命名为 Loading
export { default as LoadingState } from './ui/Loading';
