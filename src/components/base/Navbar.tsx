'use client'

import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { useEffect, useState } from 'react'
import { notificationApi } from '@/api'
function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const keyword = query.trim()
    if (!keyword) return
    if (keyword.startsWith('#')) {
      navigate(`/search?tag=${encodeURIComponent(keyword.slice(1))}`)
      return
    }
    navigate(`/search?q=${encodeURIComponent(keyword)}`)
  }
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索帖子、用户、标签..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          className="absolute right-1 flex h-9 w-10 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
          aria-label="搜索"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  )
}
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'

export default function Navbar() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const { unreadNotifications, setUnreadNotifications } = useUIStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    let mounted = true
    let timer: number | undefined
    const load = async () => {
      if (!mounted) return
      if (document.visibilityState !== 'visible') return
      try {
        const res = await notificationApi.getUnreadCount()
        if (mounted) setUnreadNotifications(res.unreadCount)
      } catch {
        if (mounted) setUnreadNotifications(0)
      }
    }
    const hasToken = !!localStorage.getItem('accessToken')
    if (isAuthenticated && hasToken) {
      load()
      timer = setInterval(load, 60000) as unknown as number
    } else {
      setUnreadNotifications(0)
    }
    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [isAuthenticated, setUnreadNotifications])

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">校园论坛</span>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                首页
              </Link>
              <Link to="/marketplace" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                交易平台
              </Link>
            </div>
          </div>

          {/* 桌面右侧操作栏 */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="w-72">
              <SearchBar />
            </div>
            {isAuthenticated && (
              <Link
                to="/posts/new"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                发帖
              </Link>
            )}
            <Link
              to="/notifications"
              className="relative text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                登录
              </Link>
            ) : (
              <div className="relative group">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.username || '用户头像'}
                    username={user?.username || '用户'}
                    size={32}
                    seed={user?.id}
                  />
                </Link>
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all dark:border-gray-800 dark:bg-gray-900">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    个人中心
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    设置
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-800"></div>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800">
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button className="md:hidden" type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <svg
              className="h-6 w-6 text-gray-700 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor">
              {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 py-4 dark:border-gray-800 md:hidden">
            {/* 移动端搜索 */}
            <div className="px-4 pb-4">
              <SearchBar />
            </div>
            <Link
              to="/"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}>
              首页
            </Link>
            <Link
              to="/marketplace"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}>
              交易平台
            </Link>
            {isAuthenticated && (
              <Link
                to="/posts/new"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}>
                发帖
              </Link>
            )}
            <Link
              to="/notifications"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}>
              通知{unreadNotifications > 0 ? `（${unreadNotifications}）` : ''}
            </Link>
            <Link
              to="/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}>
              个人中心
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}>
              设置
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}>
                登录
              </Link>
            ) : (
              <button
                onClick={() => {
                  handleLogout()
                  setIsMenuOpen(false)
                }}
                type="button"
                className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800">
                退出登录
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
