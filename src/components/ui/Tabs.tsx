/**
 * Tabs 标签页组件
 */
import { ReactNode, useState } from 'react';
import { cn } from '@/utils/helpers';

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export default function Tabs({ items, defaultActiveKey, onChange, className }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = items.find((item) => item.key === activeKey);

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key, item.disabled)}
                disabled={item.disabled}
                className={cn(
                  'flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300',
                  item.disabled && 'cursor-not-allowed opacity-50'
                )}>
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab?.content}
      </div>
    </div>
  );
}

