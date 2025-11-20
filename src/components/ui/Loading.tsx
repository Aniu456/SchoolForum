/**
 * Loading 加载状态组件
 * 支持多种尺寸、全屏模式、自定义文本
 */
import { memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const spinnerVariants = cva(
  'animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400',
  {
    variants: {
      size: {
        sm: 'h-5 w-5 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
        xl: 'h-16 w-16 border-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface LoadingProps extends VariantProps<typeof spinnerVariants> {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

function Loading({
  message = '加载中...',
  size = 'md',
  fullScreen = false,
  className,
}: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      <div className={spinnerVariants({ size })} />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        {content}
      </div>
    );
  }

  return <div className="w-full">{content}</div>;
}

export default memo(Loading);

// 导出 Spinner 组件（仅图标，无文字）
export const Spinner = memo(({ size = 'md', className }: Pick<LoadingProps, 'size' | 'className'>) => (
  <div className={cn(spinnerVariants({ size }), className)} />
));

Spinner.displayName = 'Spinner';

