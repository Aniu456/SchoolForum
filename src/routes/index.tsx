import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

// Lazy load views
const HomePage = lazy(() => import('@/pages/forum/Home'))
const LoginPage = lazy(() => import('@/pages/system/Login'))
const SearchPage = lazy(() => import('@/pages/forum/Search'))
const NotFoundPage = lazy(() => import('@/pages/system/NotFound'))

// Post views
const PostDetailPage = lazy(() => import('@/pages/forum/Post/Detail'))
const PostFormPage = lazy(() => import('@/pages/forum/Post/Form'))

// Marketplace views
const MarketplacePage = lazy(() => import('@/pages/Services/Marketplace'))
const MarketplaceDetailPage = lazy(() => import('@/pages/Services/Marketplace/Detail'))
const MarketplaceFormPage = lazy(() => import('@/pages/Services/Marketplace/Form'))

// Study Resource views
const StudyResourcesPage = lazy(() => import('@/pages/Services/StudyResources'))
const StudyResourceDetailPage = lazy(() => import('@/pages/Services/StudyResources/Detail'))
const StudyResourceFormPage = lazy(() => import('@/pages/Services/StudyResources/Form'))

// Category views removed: API.md 不提供分类接口，已移除所有分类相关功能

// User views
const ProfilePage = lazy(() => import('@/pages/forum/User/Profile'))
const UserDetailPage = lazy(() => import('@/pages/forum/User/Detail'))
// UserActivity removed: API.md 不提供活动流接口，使用通知接口代替
const NotificationsPage = lazy(() => import('@/pages/system/Notifications'))
// FavoriteFolders removed: 收藏夹功能已集成到 Profile 页面的 Tab 中

// Messages views
const ConversationsPage = lazy(() => import('@/pages/Messages/Conversations'))
const ChatPage = lazy(() => import('@/pages/Messages/Chat'))

// Auth views
const ForgotPasswordPage = lazy(() => import('@/pages/system/Auth/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('@/pages/system/Auth/ResetPassword'))

// Announcement views
const AnnouncementDetailPage = lazy(() => import('@/pages/system/Announcement/Detail'))

/**
 * 路由配置
 */
export const routes: RouteObject[] = [
  // 首页
  {
    path: '/',
    element: <HomePage />,
  },
  // 登录
  {
    path: '/login',
    element: <LoginPage />,
  },
  // 忘记密码
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  // 重置密码
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  // 搜索
  {
    path: '/search',
    element: <SearchPage />,
  },

  // 帖子相关路由
  {
    path: '/posts',
    children: [
      {
        path: 'new',
        element: <PostFormPage />,
      },
      {
        path: ':id',
        element: <PostDetailPage />,
      },
      {
        path: ':id/edit',
        element: <PostFormPage />,
      },
    ],
  },

  // 分类相关路由已移除（不在 API.md 中）

  // 用户相关路由
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  // Settings 合并到 Profile 页面
  {
    path: '/settings',
    element: <ProfilePage />,
  },
  // Drafts 合并到 Profile 页面
  {
    path: '/drafts',
    element: <ProfilePage />,
  },
  {
    path: '/users/:id',
    element: <UserDetailPage />,
  },
  // 通知
  {
    path: '/notifications',
    element: <NotificationsPage />,
  },

  // 公告
  {
    path: '/announcements/:id',
    element: <AnnouncementDetailPage />,
  },

  // 私信
  {
    path: '/messages',
    element: <ConversationsPage />,
  },
  {
    path: '/messages/:conversationId',
    element: <ChatPage />,
  },

  // 收藏夹（已集成到 Profile 页面的 Tab 中）
  {
    path: '/favorites',
    element: <ProfilePage />,
  },

  // 积分与等级（已集成到 Profile 页面）
  {
    path: '/points',
    element: <ProfilePage />,
  },

  // 用户动态已移除（API.md 中使用 /notifications 接口代替活动流）

  // 二手交易
  {
    path: '/marketplace',
    element: <MarketplacePage />,
  },
  {
    path: '/marketplace/new',
    element: <MarketplaceFormPage />,
  },
  {
    path: '/marketplace/:id',
    element: <MarketplaceDetailPage />,
  },

  // 学习资源
  {
    path: '/study-resources',
    children: [
      {
        index: true,
        element: <StudyResourcesPage />,
      },
      {
        path: 'new',
        element: <StudyResourceFormPage />,
      },
      {
        path: ':id',
        element: <StudyResourceDetailPage />,
      },
      {
        path: ':id/edit',
        element: <StudyResourceFormPage />,
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
