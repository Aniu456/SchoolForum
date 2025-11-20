/**
 * 管理员守卫
 * 保护只有管理员才能访问的路由
 */
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/config/enums';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 不是管理员，显示403页面
  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">403</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">您没有权限访问此页面</p>
          <a href="/" className="text-blue-600 hover:underline dark:text-blue-400">
            返回首页
          </a>
        </div>
      </div>
    );
  }

  // 是管理员，渲染子组件
  return <>{children}</>;
}

