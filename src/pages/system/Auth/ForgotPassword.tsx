/**
 * 忘记密码页面
 * 用户输入邮箱，系统发送密码重置链接
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/social/user';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
            {/* 成功图标 */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* 成功消息 */}
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              邮件已发送
            </h2>
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              我们已向 <span className="font-semibold">{email}</span> 发送了密码重置链接。
              请检查您的邮箱并点击链接重置密码。
            </p>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>💡 提示：</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>重置链接将在 1 小时后过期</li>
                <li>如果没有收到邮件，请检查垃圾邮件文件夹</li>
                <li>确保输入的邮箱地址正确</li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-blue-600 hover:underline dark:text-blue-400">
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          {/* 头部 */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              忘记密码
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              输入您的邮箱地址，我们将发送密码重置链接
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入您的邮箱"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? '发送中...' : '发送重置链接'}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">记起密码了？ </span>
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
