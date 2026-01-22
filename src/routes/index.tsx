import { lazy } from "react"
import { RouteObject } from "react-router-dom"

// Lazy load views
const HomePage = lazy(() => import("@/pages/forum/Home"))
const LoginPage = lazy(() => import("@/pages/system/Login"))
const SearchPage = lazy(() => import("@/pages/forum/Search"))
const NotFoundPage = lazy(() => import("@/pages/system/NotFound"))

// Post views
const PostDetailPage = lazy(() => import("@/pages/forum/Post/Detail"))
const PostFormPage = lazy(() => import("@/pages/forum/Post/Form"))

// User views
const ProfilePage = lazy(() => import("@/pages/forum/User/Profile"))
const UserDetailPage = lazy(() => import("@/pages/forum/User/Detail"))
const NotificationsPage = lazy(() => import("@/pages/system/Notifications"))

// Messages views
const ConversationsPage = lazy(() => import("@/pages/Messages/Conversations"))
const ChatPage = lazy(() => import("@/pages/Messages/Chat"))

// Auth views
const ForgotPasswordPage = lazy(() => import("@/pages/system/Auth/ForgotPassword"))
const ResetPasswordPage = lazy(() => import("@/pages/system/Auth/ResetPassword"))

// Announcement views
const AnnouncementDetailPage = lazy(() => import("@/pages/system/Announcement/Detail"))

// Marketplace views
const SecondhandPage = lazy(() => import("@/pages/Marketplace"))

// Draft views
const DraftsPage = lazy(() => import("@/pages/Drafts"))

// Study Resources views
const StudyResourcesPage = lazy(() => import("@/pages/StudyResources"))

/**
 * 路由配置
 */
export const routes: RouteObject[] = [
  // 首页
  {
    path: "/",
    element: <HomePage />,
  },
  // 登录
  {
    path: "/login",
    element: <LoginPage />,
  },
  // 忘记密码
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  // 重置密码
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  // 搜索
  {
    path: "/search",
    element: <SearchPage />,
  },

  // 帖子相关路由
  {
    path: "/posts",
    children: [
      {
        path: "new",
        element: <PostFormPage />,
      },
      {
        path: ":id",
        element: <PostDetailPage />,
      },
      {
        path: ":id/edit",
        element: <PostFormPage />,
      },
    ],
  },

  // 用户相关路由
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/settings",
    element: <ProfilePage />,
  },
  {
    path: "/drafts",
    element: <DraftsPage />,
  },
  {
    path: "/users/:id",
    element: <UserDetailPage />,
  },
  // 通知
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },

  // 公告
  {
    path: "/announcements/:id",
    element: <AnnouncementDetailPage />,
  },

  // 私信
  {
    path: "/messages",
    element: <ConversationsPage />,
  },
  {
    path: "/messages/:conversationId",
    element: <ChatPage />,
  },

  // 收藏夹
  {
    path: "/favorites",
    element: <ProfilePage />,
  },

  // 积分与等级
  {
    path: "/points",
    element: <ProfilePage />,
  },

  // 二手市场（帖子形式）
  {
    path: "/marketplace",
    element: <SecondhandPage />,
  },

  // 学习资源（帖子形式）
  {
    path: "/study-resources",
    element: <StudyResourcesPage />,
  },

  // 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
]
