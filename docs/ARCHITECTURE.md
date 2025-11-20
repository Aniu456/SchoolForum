# 项目架构概览

本项目是一个基于 React + Vite 的校园论坛 / 校园服务中心前端应用，采用功能分区 + 分层架构：

- **表现层（Pages + Components）**：路由页面、布局和 UI 组件
- **数据访问层（API + Hooks）**：统一 API 封装 + React Query Hooks
- **状态层（Store）**：基于 Zustand 的全局状态
- **服务 & 工具层（Services + Utils）**：WebSocket、格式化、Toast 等

---

## 1. 目录结构总览

```text
src/
  App.tsx               # 应用根组件
  main.tsx              # 入口，挂载 React
  globals.css           # 全局样式
  vite-env.d.ts         # Vite/TS 全局声明

  api/                  # 所有后端接口封装
  components/           # UI 组件（基础 + 复合 + 布局）
  config/               # 配置相关
  hooks/                # 自定义 Hooks（业务/数据层）
  pages/                # 页面级组件（带路由的视图）
  routes/               # 路由配置
  services/             # 前端服务层（如 websocket）
  store/                # 全局状态（Zustand）
  types/                # 全局 TS 类型
  utils/                # 工具方法 & Toast 等
```

> 约定：每个目录的**直接子项数量不超过 12 个**，通过分子目录控制复杂度。

---

## 2. API 层（`src/api`）

```text
src/api/
  core/           # 核心 HTTP 客户端 & 管理端
    client.ts     # axios 实例 + 拦截器 + 分页类型
    admin.ts      # 管理员相关 API

  social/         # 社交相关 API
    user.ts
    like.ts
    favorite.ts
    follow.ts
    notification.ts

  content/        # 内容/帖子/评论/搜索等
    post.ts
    comment.ts
    search.ts
    recommendation.ts
    announcement.ts
    report.ts

  services/       # 校园服务中心相关模块
    marketplace.ts
    resources.ts
    clubs.ts
    lostfound.ts
    carpool.ts

  index.ts        # API 汇总导出入口
```

- **使用方式**：
  - `import { favoriteApi, draftApi } from '@/api'`
  - `import { marketplaceApi } from '@/api'`
- **职责**：统一封装 HTTP 调用，隐藏 URL、参数结构和错误处理细节。

---

## 3. 组件层（`src/components`）

```text
src/components/
  base/           # 基础通用组件（全站复用）
    Avatar.tsx
    Footer.tsx
    InfiniteScroll.tsx
    Navbar.tsx
    ErrorBoundary.tsx
    ...

  composite/      # 复合组件（由多个基础组件组合）
    PostCard.tsx
    RichTextEditor.tsx
    Dialogs.tsx   # ConfirmDialog / ReportDialog

  ui/             # UI 小组件库（Button/Input/Card/Modal 等）
    index.ts      # UI 组件库汇总导出
    Button.tsx
    Card.tsx
    Input.tsx
    Select.tsx
    Textarea.tsx
    Loading.tsx
    EmptyState.tsx
    Tabs.tsx
    FilterBar.tsx
    ...

  layouts/        # 布局组件
    MainLayout.tsx
    AdminLayout.tsx
    ...

  common/         # 公共简单片段/小模块

  guards/         # 路由/权限守卫组件

  providers/      # 全局 Provider 组件

  index.ts        # 组件总入口（对外暴露 Avatar/Footer/PostCard/...）
```

- **对外使用**：
  - `import { Navbar, Footer, LoadingState, ErrorBoundary, PostCard } from '@/components'`
- **内部使用**：布局/复合组件使用相对路径从 `base/`、`ui/` 引入，减少循环依赖。

---

## 4. 页面层（`src/pages`）

### 4.1 功能分区

```text
src/pages/
  forum/              # 论坛相关页面（主论坛）
    Home/
      index.tsx       # 论坛首页帖子流
    Post/
      Detail.tsx      # 帖子详情
      Form.tsx        # 发帖/编辑
    Search/
      index.tsx       # 论坛搜索
    User/
      Profile.tsx     # 我的主页/设置/收藏夹等
      Detail.tsx      # 公开用户主页

  system/             # 系统级页面（登录、404、通知等）
    Admin/
      index.tsx
    Login/
      index.tsx
    NotFound/
      index.tsx
    Notifications/
      index.tsx

  Services/           # 校园服务中心相关页面
    index.tsx         # 服务中心主页

    Marketplace/
      index.tsx       # 列表
      Detail.tsx
      Form.tsx
    Resources/
      index.tsx
      Detail.tsx
      Form.tsx
    Clubs/
      index.tsx
      Detail.tsx
      Form.tsx
    LostFound/
      index.tsx
      Detail.tsx
      Form.tsx
    Carpool/
      index.tsx
      Detail.tsx
      Form.tsx

  Category/           # 预留分类目录（当前为空）
```

### 4.2 路由映射（简略）

路由统一定义在 `src/routes/index.tsx` 中，使用 lazy import：

```ts
const HomePage = lazy(() => import('@/pages/forum/Home'))
const LoginPage = lazy(() => import('@/pages/system/Login'))
const MarketplacePage = lazy(() => import('@/pages/Services/Marketplace'))
// ... 省略其它
```

典型路由：

- 论坛：
  - `/`、`/home` → 论坛首页
  - `/posts/:id` → 帖子详情
  - `/posts/new` → 发帖
- 用户：
  - `/profile` → 个人主页/设置
  - `/users/:id` → 公开用户主页
- 系统：
  - `/login` → 登录
  - `/notifications` → 通知列表
  - `*` → 404 页面
- 服务：
  - `/marketplace`、`/marketplace/:id`、`/marketplace/new`
  - `/resources`、`/resources/:id`、`/resources/new`
  - `/clubs`、`/clubs/recruitments/:id`、`/clubs/new`
  - `/lostfound`、`/lostfound/:id`、`/lostfound/new`
  - `/carpool`、`/carpool/:id`、`/carpool/new`

---

## 5. Hooks、Store、Services、Utils

```text
src/hooks/
  usePosts.ts         # 帖子列表/详情 hooks
  useInfinitePosts.ts # 无限滚动帖子列表
  useComments.ts      # 评论 hooks
  useUsers.ts         # 用户 hooks
  useMarketplace.ts   # 二手市场 hooks
  useResources.ts     # 学习资源 hooks
  index.ts            # 汇总导出（如需要）

src/store/
  useAuthStore.ts     # 登录态/用户信息
  useUIStore.ts       # UI 状态（主题、侧边栏等）
  index.ts

src/services/
  websocket.ts        # WebSocket 封装

src/utils/
  format.ts           # 时间/数字格式化
  helpers.ts          # 通用工具（stripHtml 等）
  avatar.ts           # 头像相关逻辑
  draft.ts            # 草稿处理
  activity.ts         # 活动/日志相关
  toast.tsx           # Toast Provider
  toast-hook.ts       # useToast hook
  toast-utils.ts      # 直接调用 toast 的工具方法
  index.ts            # 工具汇总
```

---

## 6. 文本架构图（更形象化）

### 6.1 分层架构图

```text
┌─────────────────────────────────────────────┐
│                 表现层（UI）               │
│  - src/pages/*                            │
│  - src/components/*                       │
│  - src/routes/index.tsx                   │
└─────────────────────────────────────────────┘
                  ▲
                  │ 使用 Hooks + 组件
                  │
┌─────────────────────────────────────────────┐
│              数据访问 & 状态层             │
│  - src/hooks/*                            │
│  - src/store/*                            │
└─────────────────────────────────────────────┘
                  ▲
                  │ 调用 API / 读取状态
                  │
┌─────────────────────────────────────────────┐
│                 API & 服务层               │
│  - src/api/*                              │
│  - src/services/*                         │
└─────────────────────────────────────────────┘
                  ▲
                  │ HTTP / WS 调用
                  │
┌─────────────────────────────────────────────┐
│              后端服务（REST / WS）         │
└─────────────────────────────────────────────┘
```

### 6.2 主要依赖关系（文本图）

```text
[Pages] ──使用──▶ [Components]
   │                 │
   │                 ├─使用──▶ [UI 组件库 (components/ui)]
   │                 └─使用──▶ [Layouts]
   │
   ├─调用──▶ [Hooks] ──调用──▶ [API]
   │                       │
   │                       └─依赖──▶ [core/client.ts]
   │
   ├─读取/更新──▶ [Stores (Zustand)]
   │
   └─使用──▶ [Utils (format, toast, helpers...)]

[Services/websocket] ──► 向 Hooks / Store 推送数据（如有需要）
```

> 约束：
> - `pages` 不直接访问底层 HTTP（统一走 `hooks + api`）。
> - `components` 不直接依赖具体 API 模块，只接受数据和回调。
> - `api` 模块不依赖 React，只依赖 `core/client` 和类型。

---

## 7. 路由 & 布局关系

```text
App.tsx
  ├─ QueryProvider / ToastProvider 等全局 Provider
  └─ useRoutes(routes)  ← src/routes/index.tsx

routes/index.tsx
  ├─ MainLayout        ← src/components/layouts/MainLayout.tsx
  │    └─ <Outlet />   → forum / Services / system 页面
  └─ AdminLayout       ← src/components/layouts/AdminLayout.tsx
       └─ <Outlet />   → 后台管理相关页面
```

布局组件内部统一使用：

- `Navbar` / `Footer` / `ErrorBoundary`：来自 `components/base`
- `Loading`：来自 `components/ui`

---

## 8. 目录数量限制说明

- 顶层功能目录（`api/`、`components/`、`pages/` 等）通过**分子目录**保证：
  - 任一目录的**直接子文件/子目录数量 ≤ 12**。
- 示例：
  - `src/api/` 只有 `core/`、`social/`、`content/`、`services/`、`index.ts` 共 5 个直接子项。
  - `src/components/` 下通过 `base/`、`composite/`、`ui/`、`layouts/` 等子目录拆分。
  - `src/pages/` 通过 `forum/`、`system/`、`Services/` 等划分业务域。

这样可以在项目继续扩展时，保持结构清晰、可导航性强。
