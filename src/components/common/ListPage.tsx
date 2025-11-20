/**
 * ListPage 通用列表页面组件
 * 封装了列表页面的通用结构：头部 + 筛选 + 列表 + 分页
 */
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { Button, Loading, EmptyState } from '@/components/ui';

export interface ListPageHeaderProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    to: string;
    icon?: ReactNode;
  };
}

export interface ListPageProps<T = any> {
  // 头部配置
  header: ListPageHeaderProps;

  // 筛选栏
  filterBar?: ReactNode;

  // 数据
  data?: T[];
  isLoading?: boolean;
  error?: Error | null;

  // 列表渲染
  renderItem: (item: T, index: number) => ReactNode;
  renderGrid?: boolean; // 是否使用网格布局
  gridCols?: string; // 自定义网格列数类名

  // 空状态
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };

  // 错误处理
  onRetry?: () => void; // 自定义重试函数

  // 分页
  pagination?: ReactNode;

  // 样式
  className?: string;
  containerClassName?: string;
}

export default function ListPage<T = any>({
  header,
  filterBar,
  data = [],
  isLoading = false,
  error,
  renderItem,
  renderGrid = false,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  emptyState,
  onRetry,
  pagination,
  className,
  containerClassName,
}: ListPageProps<T>) {
  return (
    <div className={cn('container mx-auto px-4 py-8', containerClassName)}>
      {/* 头部 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {header.icon && <span className="mr-2">{header.icon}</span>}
            {header.title}
          </h1>
          {header.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {header.description}
            </p>
          )}
        </div>
        {header.action && (
          <Link to={header.action.to}>
            <Button size="lg" leftIcon={header.action.icon}>
              {header.action.label}
            </Button>
          </Link>
        )}
      </div>

      {/* 筛选栏 */}
      {filterBar && <div className="mb-6">{filterBar}</div>}

      {/* 内容区域 */}
      <div className={className}>
        {/* 加载状态 */}
        {isLoading && <Loading message="加载中..." />}

        {/* 错误状态 */}
        {error && !isLoading && (
          <EmptyState
            type="error"
            title="加载失败"
            description={error.message || '请稍后重试'}
            action={{
              label: '重新加载',
              onClick: onRetry || (() => window.location.reload()),
            }}
            showHomeButton={!onRetry}
          />
        )}

        {/* 空状态 */}
        {!isLoading && !error && data.length === 0 && emptyState && (
          <EmptyState {...emptyState} />
        )}

        {/* 列表/网格 */}
        {!isLoading && !error && data.length > 0 && (
          <>
            <div
              className={cn(
                renderGrid ? `grid gap-6 ${gridCols}` : 'space-y-4'
              )}
            >
              {data.map((item, index) => renderItem(item, index))}
            </div>

            {/* 分页 */}
            {pagination && <div className="mt-8">{pagination}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// 列表项卡片组件（可选使用）
export interface ListItemCardProps {
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  footer?: ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
}

export function ListItemCard({
  title,
  description,
  image,
  tags,
  footer,
  onClick,
  to,
  className,
}: ListItemCardProps) {
  const content = (
    <div
      className={cn(
        'group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900',
        (onClick || to) && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700',
        className
      )}
      onClick={onClick}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="mb-4 h-48 w-full rounded-lg object-cover"
        />
      )}
      <h3 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
        {title}
      </h3>
      {description && (
        <p className="mb-4 line-clamp-3 text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {footer && <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">{footer}</div>}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}

