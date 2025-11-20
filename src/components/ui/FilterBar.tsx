/**
 * FilterBar 筛选栏组件
 * 通用的筛选条件组件，支持多种筛选器类型
 */
import { ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import Select, { SelectOption } from './Select';

export type FilterType = 'select' | 'multiSelect' | 'search' | 'dateRange' | 'custom';

export interface FilterItem {
  key: string;
  type: FilterType;
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  value?: any;
  onChange?: (value: any) => void;
  render?: () => ReactNode; // 自定义渲染
  className?: string;
}

export interface FilterBarProps {
  filters: FilterItem[];
  className?: string;
  layout?: 'horizontal' | 'vertical';
  columns?: number; // grid 列数
}

export default function FilterBar({
  filters,
  className,
  layout = 'horizontal',
  columns = 4,
}: FilterBarProps) {
  const renderFilter = (filter: FilterItem) => {
    // 自定义渲染
    if (filter.type === 'custom' && filter.render) {
      return filter.render();
    }

    // Select 下拉框
    if (filter.type === 'select') {
      return (
        <Select
          value={filter.value}
          onChange={filter.onChange}
          options={filter.options || []}
          placeholder={filter.placeholder}
          label={filter.label}
          className={filter.className}
        />
      );
    }

    // 搜索框
    if (filter.type === 'search') {
      return (
        <div className={filter.className}>
          {filter.label && (
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.label}
            </label>
          )}
          <div className="relative">
            <input
              type="text"
              value={filter.value || ''}
              onChange={(e) => filter.onChange?.(e.target.value)}
              placeholder={filter.placeholder || '搜索...'}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      );
    }

    return null;
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-1 md:grid-cols-4';

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div
        className={cn(
          layout === 'horizontal' ? `grid gap-4 ${gridCols}` : 'flex flex-col gap-4'
        )}
      >
        {filters.map((filter) => (
          <div key={filter.key}>{renderFilter(filter)}</div>
        ))}
      </div>
    </div>
  );
}

// 预设的筛选器按钮组（用于分类标签等）
export interface FilterButtonGroupProps {
  items: { value: string; label: string; icon?: string }[];
  value?: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
}

export function FilterButtonGroup({
  items,
  value,
  onChange,
  allowClear = true,
  clearLabel = '全部',
  className,
}: FilterButtonGroupProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {allowClear && (
        <button
          onClick={() => onChange('')}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            !value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {clearLabel}
        </button>
      )}
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            value === item.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {item.icon && <span className="mr-1">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

