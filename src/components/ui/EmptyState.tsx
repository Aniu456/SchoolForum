/**
 * EmptyState 空状态组件
 * 用于显示无数据、无结果等状态
 */
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  // 新增：次要操作（如返回首页）
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string; // 支持导航
  };
  // 新增：错误类型，用于自动设置图标和样式
  type?: 'empty' | 'error' | 'not-found' | 'network-error' | 'permission-denied';
  // 新增：是否显示返回首页按钮
  showHomeButton?: boolean;
  className?: string;
}

// 根据错误类型获取默认图标和描述
function getDefaultsByType(type: EmptyStateProps['type']) {
  switch (type) {
    case 'error':
      return { icon: '❌', defaultDescription: '加载失败，请稍后重试' };
    case 'not-found':
      return { icon: '🔍', defaultDescription: '未找到相关内容' };
    case 'network-error':
      return { icon: '📡', defaultDescription: '网络连接失败，请检查网络后重试' };
    case 'permission-denied':
      return { icon: '🔒', defaultDescription: '您没有权限访问此内容' };
    case 'empty':
    default:
      return { icon: '📭', defaultDescription: '暂无数据' };
  }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  type = 'empty',
  showHomeButton = false,
  className = ''
}: EmptyStateProps) {
  const navigate = useNavigate();
  const defaults = getDefaultsByType(type);
  const displayIcon = icon ?? defaults.icon;
  const displayDescription = description ?? defaults.defaultDescription;

  const handleSecondaryAction = () => {
    if (secondaryAction?.onClick) {
      secondaryAction.onClick();
    } else if (secondaryAction?.to) {
      navigate(secondaryAction.to);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {/* Icon */}
      {displayIcon && (
        <div className="mb-4 text-6xl opacity-50">
          {displayIcon}
        </div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
          {displayDescription}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Primary Action */}
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}

        {/* Secondary Action */}
        {secondaryAction && (
          <Button
            onClick={handleSecondaryAction}
            variant="outline"
          >
            {secondaryAction.label}
          </Button>
        )}

        {/* Home Button */}
        {showHomeButton && !secondaryAction?.to?.includes('/') && (
          <Button
            onClick={handleHomeClick}
            variant="outline"
          >
            返回首页
          </Button>
        )}
      </div>
    </div>
  );
}

