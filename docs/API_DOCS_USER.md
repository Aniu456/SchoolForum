# 普通用户端 API 文档

## 认证相关 `/auth`

### 注册
**POST** `/auth/register`

```typescript
// 请求体
{
  email: string;          // 邮箱
  username: string;       // 用户名，3-20字符
  password: string;       // 密码，6-20字符
  nickname?: string;      // 昵称，可选
}

// 响应
{
  user: {
    id: string;           // 用户ID
    username: string;     // 用户名
    email: string;        // 邮箱
    nickname: string;     // 昵称
    avatar: string;       // 头像URL
    role: "USER";         // 角色
    createdAt: Date;      // 注册时间
  }
}
```

### 登录
**POST** `/auth/login`

```typescript
// 请求体
{
  email: string;          // 邮箱
  password: string;       // 密码
}

// 响应
{
  access_token: string;   // JWT令牌
  user: {
    id: string;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    role: string;
  }
}
```

### 登出
**POST** `/auth/logout`

需要认证。

---

## 用户相关 `/users`

### 获取当前用户信息
**GET** `/users/me`

```typescript
// 响应
{
  id: string;             // 用户ID
  username: string;       // 用户名
  email: string;          // 邮箱
  nickname: string;       // 昵称
  avatar: string;         // 头像
  bio: string;            // 个人简介
  role: string;           // 角色
  isActive: boolean;      // 是否激活
  isBanned: boolean;      // 是否被封禁
  createdAt: Date;        // 注册时间
  updatedAt: Date;        // 更新时间
  _count: {
    posts: number;        // 帖子数
    comments: number;     // 评论数
    likes: number;        // 点赞数
  }
}
```

### 更新当前用户资料
**PATCH** `/users/me`

```typescript
// 请求体
{
  nickname?: string;      // 昵称
  avatar?: string;        // 头像URL
  bio?: string;           // 个人简介
}

// 响应：同用户信息
```

### 获取用户详情
**GET** `/users/:id`

公开接口。响应同上。

### 获取用户发帖列表
**GET** `/users/:id/posts?page=1&limit=20`

```typescript
// 响应
{
  data: Post[];           // 帖子列表
  meta: {
    page: number;         // 当前页
    limit: number;        // 每页条数
    total: number;        // 总数
  }
}
```

### 获取用户点赞列表
**GET** `/users/:id/likes?page=1&limit=20`

公开接口。

### 获取用户动态
**GET** `/users/:id/activity?type=posts&page=1&limit=20`

```typescript
// type: posts | comments | likes | favorites | following | followers

// 响应：不传type返回统计数据
{
  stats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    totalFavorites: number;
    totalFollowing: number;
    totalFollowers: number;
  },
  recentPosts: Post[];    // 最近5条帖子
  recentComments: Comment[]; // 最近5条评论
}

// 传type返回分页数据
{
  data: any[];
  meta: { page, limit, total }
}
```

---

## 帖子相关 `/posts`

### 创建帖子
**POST** `/posts`

```typescript
// 请求体
{
  title: string;          // 标题，1-200字符
  content: string;        // 内容
  tags?: string[];        // 标签数组
  images?: string[];      // 图片URL数组
}

// 响应
{
  id: string;             // 帖子ID
  title: string;          // 标题
  content: string;        // 内容
  tags: string[];         // 标签
  images: string[];       // 图片
  authorId: string;       // 作者ID
  viewCount: number;      // 浏览量
  likeCount: number;      // 点赞数
  commentCount: number;   // 评论数
  isPinned: boolean;      // 是否置顶
  isHighlighted: boolean; // 是否加精
  isDeleted: boolean;     // 是否删除
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
  author: {               // 作者信息
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  }
}
```

### 获取帖子列表
**GET** `/posts?page=1&limit=20&sort=latest&tag=前端`

```typescript
// sort: latest | hot | trending
// tag: 标签筛选

// 响应
{
  data: Post[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

### 获取帖子详情
**GET** `/posts/:id`

公开接口。响应同创建帖子。

### 更新帖子
**PATCH** `/posts/:id`

只能更新自己的帖子。

### 删除帖子
**DELETE** `/posts/:id`

只能删除自己的帖子（软删除）。

---

## 评论相关 `/comments`

### 创建评论
**POST** `/comments`

```typescript
// 请求体
{
  postId: string;         // 帖子ID
  content: string;        // 评论内容
  parentId?: string;      // 父评论ID（回复）
}

// 响应
{
  id: string;
  postId: string;
  content: string;
  authorId: string;
  parentId: string | null;
  likeCount: number;
  replyCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  }
}
```

### 获取帖子评论
**GET** `/comments/post/:postId?page=1&limit=20`

公开接口。

### 获取评论回复
**GET** `/comments/:id/replies?page=1&limit=10`

公开接口。

### 删除评论
**DELETE** `/comments/:id`

只能删除自己的评论。

---

## 点赞相关 `/likes`

### 点赞/取消点赞
**POST** `/likes/toggle`

```typescript
// 请求体
{
  targetId: string;       // 目标ID（帖子或评论）
  targetType: "POST" | "COMMENT"; // 目标类型
}

// 响应
{
  message: string;        // "点赞成功" 或 "取消点赞"
  isLiked: boolean;       // 当前点赞状态
}
```

---

## 收藏相关 `/favorites`

### 创建收藏夹
**POST** `/favorites/folders`

```typescript
// 请求体
{
  name: string;           // 收藏夹名称
  description?: string;   // 描述
}

// 响应
{
  id: string;
  name: string;
  description: string;
  postCount: number;
  isDefault: boolean;
  createdAt: Date;
}
```

### 收藏帖子
**POST** `/favorites`

```typescript
// 请求体
{
  postId: string;         // 帖子ID
  folderId?: string;      // 收藏夹ID（可选，默认收藏夹）
}
```

### 获取我的收藏夹
**GET** `/favorites/folders`

### 获取收藏夹内容
**GET** `/favorites/folders/:id?page=1&limit=20`

### 取消收藏
**DELETE** `/favorites/:id`

---

## 关注相关 `/users/:id/follow`

### 关注用户
**POST** `/users/:id/follow`

```typescript
// 响应
{
  message: "关注成功";
  followingId: string;
}
```

### 取消关注
**POST** `/users/:id/unfollow`

### 获取关注列表
**GET** `/users/:id/following?page=1&limit=20`

公开接口。

### 获取粉丝列表
**GET** `/users/:id/followers?page=1&limit=20`

公开接口。

---

## 草稿相关 `/posts/drafts`

### 创建/更新草稿
**POST** `/posts/drafts`

```typescript
// 请求体
{
  title?: string;
  content?: string;
  tags?: string[];
  images?: string[];
}

// 响应：草稿对象
```

### 获取我的草稿列表
**GET** `/posts/drafts?page=1&limit=20`

### 获取草稿详情
**GET** `/posts/drafts/:id`

### 发布草稿
**POST** `/posts/drafts/:id/publish`

### 删除草稿
**DELETE** `/posts/drafts/:id`

---

## 搜索 `/search`

### 搜索帖子
**GET** `/search?q=关键词&page=1&limit=20`

公开接口。

### 搜索用户
**GET** `/search/users?q=用户名&page=1&limit=20`

公开接口。

---

## 推荐相关 `/recommendations`

### 获取推荐帖子
**GET** `/recommendations/posts?limit=20`

公开接口。基于用户兴趣的个性化推荐。

### 获取热门帖子
**GET** `/recommendations/hot?limit=20`

公开接口。

### 获取趋势帖子
**GET** `/recommendations/trending?limit=20`

公开接口。

### 获取最新帖子
**GET** `/recommendations/latest?limit=20`

公开接口。

---

## 算法相关 `/algorithms`

### 获取热门帖子（算法）
**GET** `/algorithms/hot-posts?limit=20`

公开接口。Reddit热度算法。

### 获取趋势帖子（算法）
**GET** `/algorithms/trending-posts?limit=20`

公开接口。

### 获取优质帖子
**GET** `/algorithms/quality-posts?limit=20`

公开接口。

### 获取热门标签
**GET** `/algorithms/hot-tags?limit=50`

公开接口。

### 获取趋势标签
**GET** `/algorithms/trending-tags?limit=30`

公开接口。

---

## 积分相关 `/points`

### 获取我的积分
**GET** `/points/me`

```typescript
// 响应
{
  id: string;
  userId: string;
  totalPoints: number;    // 总积分
  level: number;          // 等级
  nextLevelPoints: number; // 下一级所需积分
  progress: number;       // 进度百分比
  createdAt: Date;
  updatedAt: Date;
}
```

### 获取积分历史
**GET** `/points/history?page=1&limit=20`

```typescript
// 响应
{
  data: [
    {
      id: string;
      action: string;     // POST_CREATED, RECEIVED_LIKE等
      points: number;     // 积分变化（正负）
      reason: string;     // 原因
      relatedId: string;  // 关联ID
      createdAt: Date;    // 时间
    }
  ],
  meta: { page, limit, total, totalPages }
}
```

### 获取积分排行榜
**GET** `/points/leaderboard?limit=50`

公开接口。

---

## 市场模块

### 二手交易 `/secondhand`

#### 发布商品
**POST** `/secondhand`

```typescript
// 请求体
{
  title: string;          // 商品标题
  description: string;    // 描述
  price: number;          // 价格
  images: string[];       // 图片
  category: string;       // 分类
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR"; // 新旧程度
  location?: string;      // 位置
  contact: string;        // 联系方式
}

// 响应：商品对象
{
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD"; // 状态
  sellerId: string;
  viewCount: number;
  location: string;
  contact: string;
  createdAt: Date;
  seller: { id, username, nickname, avatar }
}
```

#### 获取商品列表
**GET** `/secondhand?page=1&limit=20&category=电子产品&status=AVAILABLE`

公开接口。

#### 获取商品详情
**GET** `/secondhand/:id`

公开接口。

#### 更新商品
**PATCH** `/secondhand/:id`

只能更新自己的商品。

#### 删除商品
**DELETE** `/secondhand/:id`

---

### 学习资源 `/study-resources`

#### 上传资源
**POST** `/study-resources`

```typescript
// 请求体
{
  title: string;          // 资源标题
  description: string;    // 描述
  category: string;       // 分类
  type: "DOCUMENT" | "VIDEO" | "LINK" | "CODE" | "OTHER"; // 类型
  fileUrl?: string;       // 文件URL
  link?: string;          // 链接
  tags?: string[];        // 标签
}

// 响应：资源对象
```

#### 获取资源列表
**GET** `/study-resources?page=1&limit=20&category=算法&type=DOCUMENT`

公开接口。

#### 下载资源（增加下载量）
**POST** `/study-resources/:id/download`

---

### 社团招新 `/clubs`

#### 发布招新
**POST** `/clubs`

```typescript
// 请求体
{
  clubName: string;       // 社团名称
  description: string;    // 描述
  requirements: string;   // 要求
  contact: string;        // 联系方式
  logo?: string;          // Logo
  images?: string[];      // 宣传图
  category: string;       // 分类
  recruitCount?: number;  // 招新人数
  deadline?: Date;        // 截止日期
}

// 响应：招新信息对象
{
  id: string;
  clubName: string;
  description: string;
  requirements: string;
  contact: string;
  logo: string;
  images: string[];
  category: string;
  recruitCount: number;
  deadline: Date;
  publisherId: string;
  viewCount: number;
  status: "OPEN" | "CLOSED" | "PAUSED";
  createdAt: Date;
  publisher: { id, username, nickname, avatar }
}
```

#### 获取招新列表
**GET** `/clubs?page=1&limit=20&category=技术&status=OPEN`

公开接口。

---

### 失物招领 `/lost-found`

#### 发布信息
**POST** `/lost-found`

```typescript
// 请求体
{
  title: string;          // 标题
  description: string;    // 描述
  images?: string[];      // 图片
  type: "LOST" | "FOUND"; // 寻物/招领
  category: string;       // 分类
  location: string;       // 地点
  date: Date;             // 日期
  contact: string;        // 联系方式
}

// 响应：信息对象
{
  id: string;
  title: string;
  description: string;
  images: string[];
  type: "LOST" | "FOUND";
  category: string;
  location: string;
  date: Date;
  contact: string;
  publisherId: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  createdAt: Date;
  publisher: { id, username, nickname, avatar }
}
```

#### 获取列表
**GET** `/lost-found?page=1&limit=20&type=LOST&status=OPEN`

公开接口。

---

### 拼车拼单 `/carpool`

#### 发布拼车/拼单
**POST** `/carpool`

```typescript
// 请求体
{
  title: string;          // 标题
  type: "CARPOOL" | "GROUP_BUY"; // 拼车/拼单
  departure: string;      // 出发地
  destination: string;    // 目的地
  departureTime: Date;    // 出发时间
  seats: number;          // 座位数/名额
  price?: number;         // 价格
  description?: string;   // 描述
  contact: string;        // 联系方式
}

// 响应：拼车对象
{
  id: string;
  title: string;
  type: "CARPOOL" | "GROUP_BUY";
  departure: string;
  destination: string;
  departureTime: Date;
  seats: number;
  price: number;
  description: string;
  contact: string;
  publisherId: string;
  status: "OPEN" | "FULL" | "CLOSED";
  createdAt: Date;
  publisher: { id, username, nickname, avatar }
}
```

#### 获取列表
**GET** `/carpool?page=1&limit=20&type=CARPOOL&status=OPEN`

公开接口。

---

## 公告 `/announcements`

### 获取公告列表
**GET** `/announcements?page=1&limit=20&type=INFO`

公开接口。

```typescript
// type: INFO | WARNING | URGENT

// 响应
{
  data: [
    {
      id: string;
      title: string;      // 标题
      content: string;    // 内容
      type: "INFO" | "WARNING" | "URGENT"; // 类型
      targetRole: "ALL" | "USER" | "ADMIN"; // 目标角色
      publisherId: string;
      isPinned: boolean;  // 是否置顶
      createdAt: Date;
      publisher: { id, username, nickname, avatar }
    }
  ],
  meta: { page, limit, total }
}
```

### 获取公告详情
**GET** `/announcements/:id`

公开接口。

---

## 通知 `/notifications`

### 获取我的通知
**GET** `/notifications?page=1&limit=20&type=COMMENT`

```typescript
// type: COMMENT | REPLY | LIKE | SYSTEM | NEW_POST | NEW_FOLLOWER

// 响应
{
  data: [
    {
      id: string;
      type: string;       // 通知类型
      senderId: string;   // 发送者ID
      content: string;    // 内容
      relatedId: string;  // 关联ID
      isRead: boolean;    // 是否已读
      createdAt: Date;
      sender: { id, username, nickname, avatar }
    }
  ],
  meta: { page, limit, total }
}
```

### 获取未读数量
**GET** `/notifications/unread-count`

```typescript
// 响应
{
  count: number;          // 未读数量
}
```

### 标记为已读
**PATCH** `/notifications/:id/read`

### 全部标记已读
**PATCH** `/notifications/mark-all-read`

### 删除通知
**DELETE** `/notifications/:id`

---

## WebSocket 实时通知

连接地址：`ws://localhost:3000`

需要在连接时传递JWT token。

### 监听事件

```typescript
// 新通知
socket.on('notification:new', (data) => {
  // data: 通知对象
});

// 新帖子（关注的人发帖）
socket.on('post:new', (data) => {
  // data: 帖子对象
});

// 新粉丝
socket.on('follower:new', (data) => {
  // data: 用户对象
});

// 未读数更新
socket.on('notification:unread-count', (data) => {
  // data: { count: number }
});
```

### 发送心跳
```typescript
socket.emit('heartbeat');
```
