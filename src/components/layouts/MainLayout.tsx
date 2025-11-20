/**
 * 主布局组件
 * 包含导航栏、侧边栏、主内容区和页脚
 */
import { ReactNode, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../base/Navbar';
import Footer from '../base/Footer';
import { ErrorBoundary } from '../base/ErrorBoundary';
import { Loading } from '../ui';

interface MainLayoutProps {
  children?: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export default function MainLayout({
  children,
  showSidebar = false,
  showFooter = true
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* 导航栏 */}
      <Navbar />

      {/* 主内容区 */}
      <main className="flex-1">
        <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${showSidebar ? 'lg:grid lg:grid-cols-12 lg:gap-8' : ''}`}>
          {/* 侧边栏（可选） */}
          {showSidebar && (
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-20 space-y-4">
                {/* 侧边栏内容可以通过 context 或 props 传入 */}
                <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">快速导航</h3>
                  {/* 侧边栏导航项 */}
                </div>
              </div>
            </aside>
          )}

          {/* 主内容 */}
          <div className={showSidebar ? 'lg:col-span-9' : ''}>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                {children || <Outlet />}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      {showFooter && <Footer />}
    </div>
  );
}

