/**
 * 重置密码页面
 * 用户输入邮箱、验证码和新密码
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/social/user';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailFromUrl = searchParams.get('email');

  const [email, setEmail] = useState(emailFromUrl || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    if (!code) {
      setError('请输入验证码');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({ email, code, newPassword: password });
      setSuccess(true);
      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || '重置失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置成功
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

            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              密码重置成功
            </h2>
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              您的密码已成功重置，3 秒后将自动跳转到登录页面。
            </p>

            <Link
              to="/login"
              className="block w-full rounded-lg bg-blue-600 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 重置表单
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          {/* 头部 */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              重置密码
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              请输入您的邮箱、验证码和新密码
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

            <div>
              <label
                htmlFor="code"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                验证码
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="请输入邮件中的验证码"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                验证码已发送到您的邮箱，请查收
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                新密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="请输入新密码（至少 6 个字符）"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="请再次输入新密码"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? '重置中...' : '重置密码'}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:underline dark:text-blue-400">
              重新获取验证码
            </Link>
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