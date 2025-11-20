/**
 * 认证布局组件
 * 用于登录、注册等认证相关页面
 */
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">校园论坛</span>
        </Link>
      </div>

      {/* 主内容 */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* 标题 */}
          {(title || subtitle) && (
            <div className="text-center">
              {title && (
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* 表单卡片 */}
          <div className="rounded-lg border bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {children}
          </div>

          {/* 页脚信息 */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>公益性开放性校园论坛</p>
            <p className="mt-1">服务学生群体 · 自由交流平台</p>
          </div>
        </div>
      </div>
    </div>
  );
}

