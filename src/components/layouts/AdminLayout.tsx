/**
 * 管理员布局组件
 * 用于管理后台页面
 */
import { ReactNode, Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../base/ErrorBoundary';
import { Loading } from '../ui';

interface AdminLayoutProps {
  children?: ReactNode;
}

const adminMenuItems = [
  { path: '/admin/moderation', label: '内容审核', icon: '🛡️' },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/reports', label: '举报管理', icon: '⚠️' },
  { path: '/admin/announcements', label: '公告管理', icon: '📢' },
  { path: '/admin/statistics', label: '数据统计', icon: '📊' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 侧边栏 */}
      <aside className="w-64 border-r bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6 dark:border-gray-800">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">管理后台</span>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1 p-4">
            {adminMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 返回首页 */}
          <div className="border-t p-4 dark:border-gray-800">
            <Link
              to="/"
              className="flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              <span className="text-lg">🏠</span>
              <span>返回首页</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6">
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              {children || <Outlet />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

