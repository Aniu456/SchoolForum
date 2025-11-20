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

// Services views
const ServicesPage = lazy(() => import('@/pages/Services'))
const MarketplacePage = lazy(() => import('@/pages/Services/Marketplace'))
const MarketplaceDetailPage = lazy(() => import('@/pages/Services/Marketplace/Detail'))
const MarketplaceFormPage = lazy(() => import('@/pages/Services/Marketplace/Form'))
const ResourcesPage = lazy(() => import('@/pages/Services/Resources'))
const ResourceDetailPage = lazy(() => import('@/pages/Services/Resources/Detail'))
const ResourceFormPage = lazy(() => import('@/pages/Services/Resources/Form'))
const ClubsPage = lazy(() => import('@/pages/Services/Clubs'))
const ClubRecruitmentDetailPage = lazy(() => import('@/pages/Services/Clubs/Detail'))
const ClubRecruitmentFormPage = lazy(() => import('@/pages/Services/Clubs/Form'))
const LostFoundPage = lazy(() => import('@/pages/Services/LostFound'))
const LostFoundDetailPage = lazy(() => import('@/pages/Services/LostFound/Detail'))
const LostFoundFormPage = lazy(() => import('@/pages/Services/LostFound/Form'))
const CarpoolPage = lazy(() => import('@/pages/Services/Carpool'))
const CarpoolDetailPage = lazy(() => import('@/pages/Services/Carpool/Detail'))
const CarpoolFormPage = lazy(() => import('@/pages/Services/Carpool/Form'))

// Category views removed: API.md 不提供分类接口，已移除所有分类相关功能

// User views
const ProfilePage = lazy(() => import('@/pages/forum/User/Profile'))
const UserDetailPage = lazy(() => import('@/pages/forum/User/Detail'))
// UserActivity removed: API.md 不提供活动流接口，使用通知接口代替
const NotificationsPage = lazy(() => import('@/pages/system/Notifications'))
// FavoriteFolders removed: 收藏夹功能已集成到 Profile 页面的 Tab 中

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

  // 收藏夹（已集成到 Profile 页面的 Tab 中）
  {
    path: '/favorites',
    element: <ProfilePage />,
  },

  // 用户动态已移除（API.md 中使用 /notifications 接口代替活动流）

  // 服务中心
  {
    path: '/services',
    element: <ServicesPage />,
  },

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
    path: '/resources',
    element: <ResourcesPage />,
  },
  {
    path: '/resources/new',
    element: <ResourceFormPage />,
  },
  {
    path: '/resources/:id',
    element: <ResourceDetailPage />,
  },

  // 社团招新
  {
    path: '/clubs',
    element: <ClubsPage />,
  },
  {
    path: '/clubs/new',
    element: <ClubRecruitmentFormPage />,
  },
  {
    path: '/clubs/recruitments/:id',
    element: <ClubRecruitmentDetailPage />,
  },

  // 失物招领
  {
    path: '/lostfound',
    element: <LostFoundPage />,
  },
  {
    path: '/lostfound/new',
    element: <LostFoundFormPage />,
  },
  {
    path: '/lostfound/:id',
    element: <LostFoundDetailPage />,
  },

  // 拼车拼单
  {
    path: '/carpool',
    element: <CarpoolPage />,
  },
  {
    path: '/carpool/new',
    element: <CarpoolFormPage />,
  },
  {
    path: '/carpool/:id',
    element: <CarpoolDetailPage />,
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
