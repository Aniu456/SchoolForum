一、整体：一个后端，两套前端（普通用户端 + Admin）。下面每个功能块附上已实现的真实 API、请求要求和主要返回字段，便于前端直接对接。

二、论坛网站端（普通用户）功能 & API

1. 账号与个人中心

- 注册/登录/令牌：`POST /auth/register`（email, username, password, nickname?） / `POST /auth/login`（email, password） / `POST /auth/refresh`（refreshToken） / `POST /auth/logout`；返回 `accessToken`、`refreshToken`、`user { id, username, email, nickname, avatar, role }`
- 找回密码：`POST /auth/forgot-password`（email），`POST /auth/reset-password`（email, code, newPassword）
- 获取/更新自己：`GET /users/me`，`PATCH /users/me`（nickname?, avatar?, bio?）；返回用户基础信息 + `_count { posts, comments, likes }`
- 用户详情与内容：`GET /users/:id`；`GET /users/:id/posts?page&limit`；`GET /users/:id/likes?page&limit`；`GET /users/:id/activity?type=posts|comments|likes|favorites|following|followers` 返回 stats 或对应分页数据
- 关注与粉丝：`POST /users/:id/follow` / `DELETE /users/:id/follow` / `GET /users/:id/following` / `GET /users/:id/followers` / `GET /users/:id/follow/status`（返回 `{ isFollowing }`）
- 上传：`POST /upload/avatar`（file）/`/upload/image`/`/upload/images`/`/upload/document`，返回 `url` 或 `urls`

2. 内容展示与互动（帖子/评论/点赞/收藏）

- 帖子 CRUD：`POST /posts`（title, content, tags?, images?）返回 `{ id, title, content, tags, images, authorId, viewCount, likeCount, commentCount, isPinned, isHighlighted, createdAt, updatedAt, author{ id, username, nickname, avatar } }`；`GET /posts?page&limit&sortBy=createdAt|viewCount&order=desc|asc&tag=xxx`；`GET /posts/:id`；`PATCH /posts/:id`（仅作者）；`DELETE /posts/:id`（物理删除，作者）
- 评论：`POST /comments`（postId, content, parentId?），返回评论字段；`GET /posts/:id/comments?page&limit&sortBy=createdAt|likeCount`；`GET /comments/:id/replies?page&limit`；`DELETE /comments/:id`（物理删除，作者）
- 点赞：`POST /likes/toggle`（targetId, targetType: POST|COMMENT），返回 `{ isLiked, likeCount }`
- 收藏夹/收藏：`POST /favorites/folders`（name, description?）；`POST /favorites`（postId, folderId?）；`GET /favorites/folders`；`GET /favorites/folders/:id`；`GET /favorites/folders/:folderId/posts?page&limit`；`PATCH /favorites/folders/:id`；`DELETE /favorites/folders/:id`；取消收藏 `DELETE /favorites/:id`
- 草稿：`POST /posts/drafts`（title?, content?, tags?, images?）返回草稿；`GET /posts/drafts?page&limit`；`GET /posts/drafts/:id`；发布 `POST /posts/drafts/:id/publish`；`DELETE /posts/drafts/:id`
- 搜索/推荐/动态：`GET /search/posts|users`；`GET /recommendations/*`（following/hot/trending/latest/topics等）；`GET /activities/following?page&limit`，`GET /activities/me?page&limit`

3. 私信（用户对用户）

- 创建或获取会话：`POST /conversations`（participantId UUID）返回 `{ id, type:"DIRECT", otherUser, lastMessage?, lastReadAt?, createdAt }`
- 会话列表/详情：`GET /conversations?page&limit`；`GET /conversations/:id`（UUID 校验）
- 消息列表：`GET /conversations/:id/messages?page&limit`，会自动标记未读并返回 `data[{ id, conversationId, senderId, content, isRead, readAt?, createdAt, sender{ id, username, nickname, avatar } }] + meta`
- 发送消息：`POST /conversations/:id/messages`（content），返回消息对象；删除消息：`DELETE /conversations/messages/:messageId`
- 未读计数：`GET /conversations/unread-count` 返回 `{ count }`

4. 系统通知

- 拉取通知：`GET /notifications?page&limit&type=COMMENT|REPLY|LIKE|SYSTEM|NEW_POST|NEW_FOLLOWER&isRead=false` 返回 `data[{ id, type, senderId, content, relatedId, isRead, createdAt, sender{...} }] + meta`
- 未读数：`GET /notifications/unread/count` 返回 `{ count }`
- 标记已读：`PATCH /notifications/:id/read`；全部已读：`POST /notifications/read-all`；删除：`DELETE /notifications/:id`

5. 公告

- 列表：`GET /announcements?page&limit` 返回 `id, title, content, type(INFO|WARNING|URGENT), targetRole(USER|ADMIN|null), isPinned, createdAt, author{ id, username, nickname, avatar }`
- 详情：`GET /announcements/:id`

6. 服务中心 / 市场与资源

- 统一说明：社团招新、失物招领、拼车拼单均用 `/posts`，在创建时带标签（如 `"社团招新"`、`"失物招领"`、`"拼车拼单"` 等），查询用 `GET /posts?tag=标签`
- 专用查询入口：`GET /service-center/categories`；`GET /service-center/club-recruitment|lost-and-found|carpool|secondhand|study-resource?page&limit`（底层等价于带固定 tag 的 `/posts`）
- 二手交易：`POST /secondhand`（title, description, price, images[], category, condition, location?, contact）返回商品对象 `{ id, title, description, price, images, category, condition, status, sellerId, viewCount, location, contact, createdAt, seller{...} }`；`GET /secondhand?page&limit&category&status`；`GET /secondhand/:id`；`PATCH /secondhand/:id`；`DELETE /secondhand/:id`
- 学习资源：`POST /study-resources`（title, description, category, type DOCUMENT|VIDEO|LINK|CODE|OTHER, fileUrl?, link?, tags?）；`GET /study-resources?page&limit&category&type`；`POST /study-resources/:id/download`；`PATCH /study-resources/:id`；`DELETE /study-resources/:id`
- 标签化查询示例：`GET /posts?tag=社团招新`，`GET /posts?tag=失物招领&tag=寻物`，`GET /posts?tag=拼车拼单&tag=拼车`

7. 互动/动态补充

- 点赞、收藏、关注、通知均带实时计数返回；WebSocket 通知在连接时需传 `auth.token = accessToken`，事件见 `docs/API_DOCS_USER.md`。

三、后台管理端（Admin）

- 初始化管理员：`POST /auth/register-admin`（需要 ADMIN_REGISTRATION_KEY）
- 管理能力沿用同一批 REST：用户、帖子、评论、公告接口均返回完整字段，可基于角色在前端展示封禁/隐藏/置顶等操作（帖子/评论删除为物理删除）。
