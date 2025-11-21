'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, Button } from '@/components';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 注册表单
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateRegistration = () => {
    // 用户名验证：3-50 字符（根据数据库 varchar(50)）
    if (username.length < 3 || username.length > 50) {
      setError('用户名长度应为 3-50 字符');
      return false;
    }

    // 邮箱格式验证：<=100 字符（根据数据库 varchar(100)）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    if (email.length > 100) {
      setError('邮箱长度不能超过 100 字符');
      return false;
    }

    // 密码验证：6+ 字符（数据库可存储最多255字符）
    if (password.length < 6) {
      setError('密码长度至少为 6 字符');
      return false;
    }

    // 确认密码验证
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    // 昵称验证：<=100 字符（可选，根据数据库 varchar(100)）
    if (nickname && nickname.length > 100) {
      setError('昵称长度不能超过 100 字符');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });

      const { user, accessToken, refreshToken } = data;
      useAuthStore.getState().setAuth({ user, accessToken, refreshToken });
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err?.response?.data?.message || '登录失败，请检查邮箱和密码');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证表单
    if (!validateRegistration()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registerData: any = {
        username,
        email,
        password,
      };

      // 添加可选字段
      if (nickname.trim()) registerData.nickname = nickname;

      // 普通用户注册
      const data = await authApi.register(registerData);

      const { user, accessToken, refreshToken } = data;
      useAuthStore.getState().setAuth({ user, accessToken, refreshToken });
      navigate('/');
    } catch (err: any) {
      console.error('Registration error', err);
      setError(
        err?.response?.data?.message || '注册失败，请检查输入信息'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-4 py-12">
      <Card className="w-full p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLogin ? '登录' : '注册'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isLogin ? '欢迎回到校园论坛' : '加入校园论坛，开始你的交流之旅'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {isLogin ? (
          // 登录表单
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="loginEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                邮箱
              </label>
              <input
                type="email"
                id="loginEmail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入邮箱"
              />
            </div>

            <div>
              <label
                htmlFor="loginPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                密码
              </label>
              <input
                type="password"
                id="loginPassword"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入密码"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '登录中...' : '登录'}
            </Button>

            {/* 忘记密码链接 */}
            <div className="text-center text-sm">
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline dark:text-blue-400">
                忘记密码？
              </a>
            </div>
          </form>
        ) : (
          // 注册表单
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 用户名 - 必填 */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                用户名 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">(3-50 字符)</span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入用户名"
              />
            </div>

            {/* 邮箱 - 必填 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                邮箱 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">(最多100字符)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={100}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入邮箱"
              />
            </div>

            {/* 密码 - 必填 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                密码 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">(至少6字符)</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入密码"
              />
            </div>

            {/* 确认密码 - 必填 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请再次输入密码"
              />
            </div>

            {/* 昵称 - 可选 */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                昵称（可选）
                <span className="ml-2 text-xs text-gray-500">
                  (最多 100 字符，不填则使用用户名)
                </span>
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={100}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="请输入昵称"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '注册中...' : '注册'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? '还没有账号？点击注册' : '已有账号？点击登录'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
