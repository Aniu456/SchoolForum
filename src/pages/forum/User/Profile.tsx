"use client"

import { favoriteApi, followApi, uploadApi, userApi, type Favorite } from "@/api"

import { Avatar, Button, Card, EmptyState, LoadingState } from "@/components"
import ProfileTabsContent from "@/components/composite/ProfileTabsContent"
import { UPLOAD_CONFIG } from "@/config/constants"
import { useFollowingActivities } from "@/hooks/useActivity"
import { usePosts } from "@/hooks/usePosts"
import { useUserFollowers, useUserFollowing } from "@/hooks/useUsers"
import { useAuthStore } from "@/store/useAuthStore"
import type { Post } from "@/types"
import { formatTime } from "@/utils/format"
import { useToast } from "@/utils/toast-hook"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

type Tab = "posts" | "favorites" | "connections" | "activity" | "settings"

export default function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { user: currentUser, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const { data: postsData, isLoading } = usePosts({})
  const posts = Array.isArray(postsData) ? postsData : postsData?.data || []

  // 关注/粉丝分页状态
  const [followingPage, setFollowingPage] = useState(1)
  const [followersPage, setFollowersPage] = useState(1)
  const CONNECTIONS_LIMIT = 20 // 每页显示 20 条

  // 关注/粉丝子标签
  const [connectionsSubTab, setConnectionsSubTab] = useState<"following" | "followers">("following")

  const {
    data: followingData,
    isLoading: followingLoading,
    refetch: refetchFollowing,
  } = useUserFollowing(currentUser?.id || "", followingPage, CONNECTIONS_LIMIT)
  const {
    data: followersData,
    isLoading: followersLoading,
    refetch: refetchFollowers,
  } = useUserFollowers(currentUser?.id || "", followersPage, CONNECTIONS_LIMIT)

  // 关注状态管理
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})

  // 动态类型筛选
  const [activityType, setActivityType] = useState<"all" | "posts" | "comments" | "likes" | "favorites">("all")

  // 动态分页和排序
  const [activityPage, setActivityPage] = useState(1)
  const [activitySortDesc, setActivitySortDesc] = useState(true) // true=倒序（最新在前），false=正序（最旧在前）
  const ACTIVITY_LIMIT = 20

  // 关注用户的动态流 - 后端已实现，返回格式: {type, id, author, content, createdAt, data}
  const { data: activitiesData, isLoading: isActivitiesLoading } = useFollowingActivities({
    page: activityPage,
    limit: ACTIVITY_LIMIT,
  })
  const allActivities = activitiesData?.data || []

  // 动态类型筛选和排序
  const filteredActivities =
    activityType === "all"
      ? allActivities
      : allActivities.filter((activity: any) => {
          if (activityType === "posts") return activity.type === "POST"
          if (activityType === "comments") return activity.type === "COMMENT"
          if (activityType === "likes") return activity.type === "LIKE"
          if (activityType === "favorites") return activity.type === "FAVORITE"
          return true
        })

  // 排序逻辑
  const activities = [...filteredActivities].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return activitySortDesc ? timeB - timeA : timeA - timeB
  })

  // 收藏状态
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false)
  const [favoritesPage, setFavoritesPage] = useState(1)

  // 积分相关状态 - Removed
  // const [pointsTab, setPointsTab] = useState<"overview" | "history" | "leaderboard">("overview")
  // const [historyPage, setHistoryPage] = useState(1)

  // 根据路由确定默认 tab
  const getDefaultTab = (): Tab => {
    if (location.pathname === "/settings") return "settings"
    if (location.pathname === "/favorites") return "favorites"
    // 检查URL查询参数
    const params = new URLSearchParams(location.search)
    const tabParam = params.get("tab")
    if (tabParam === "connections") return "connections"
    return "posts"
  }

  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab())

  // 根据URL参数设置子标签
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const subtab = params.get("subtab")
    if (subtab === "following" || subtab === "followers") {
      setConnectionsSubTab(subtab)
    }
  }, [location.search])

  /* Points queries removed */

  // 设置表单状态
  const [username, setUsername] = useState(currentUser?.username || "")
  const [nickname, setNickname] = useState(currentUser?.nickname || "")
  const [email, setEmail] = useState(currentUser?.email || "")
  const [bio, setBio] = useState(currentUser?.bio || "")
  const [avatar, setAvatar] = useState(currentUser?.avatar || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // 加载收藏列表
  const loadFavorites = async () => {
    setIsFavoritesLoading(true)
    try {
      const response = await favoriteApi.getFavorites(favoritesPage, 20)
      if (favoritesPage === 1) {
        setFavorites(response.data || [])
      } else {
        setFavorites((prev) => [...prev, ...(response.data || [])])
      }
    } catch {
      showError("加载收藏失败")
      setFavorites([])
    } finally {
      setIsFavoritesLoading(false)
    }
  }

  // 当 currentUser 变化时，同步状态
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "")
      setNickname(currentUser.nickname || "")
      setEmail(currentUser.email || "")
      setBio(currentUser.bio || "")
      setAvatar(currentUser.avatar || "")
    }
  }, [currentUser])

  // 处理关注/取消关注
  const handleToggleFollow = async (userId: string, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) {
        await followApi.unfollowUser(userId)
        showSuccess("已取消关注")
      } else {
        await followApi.followUser(userId)
        showSuccess("关注成功")
      }

      // 刷新缓存
      await queryClient.invalidateQueries({ queryKey: ["user", userId] })
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      await queryClient.invalidateQueries({ queryKey: ["followers"] })
      await queryClient.invalidateQueries({ queryKey: ["following"] })

      // 重新检查关注状态
      const { isFollowing } = await followApi.checkFollowing(userId)
      setFollowingStates((prev) => ({ ...prev, [userId]: isFollowing }))

      // 刷新列表
      await refetchFollowing()
      await refetchFollowers()
    } catch (error: any) {
      console.error("关注操作错误:", error)
      const errorMessage = error?.message || error?.response?.data?.message || error?.data?.message || ""

      if (errorMessage.includes("已经关注") || errorMessage.includes("已关注")) {
        showSuccess("已关注")
        setFollowingStates((prev) => ({ ...prev, [userId]: true }))
      } else if (errorMessage.includes("未关注")) {
        showSuccess("已取消关注")
        setFollowingStates((prev) => ({ ...prev, [userId]: false }))
      } else {
        showError(`操作失败：${errorMessage || "请重试"}`)
      }

      await refetchFollowing()
      await refetchFollowers()
    }
  }

  /* Drafts loading removed - drafts are local only now */

  // 页面加载时获取收藏数据
  useEffect(() => {
    if (activeTab === "favorites") {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, favoritesPage])

  if (!currentUser) {
    navigate("/login")
    return null
  }

  if (isLoading) {
    return <LoadingState message="加载中..." />
  }

  // 用户的帖子
  const userPosts = posts.filter((post: Post) => post.author && post.author.id === currentUser.id)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        nickname: nickname?.trim() || undefined,
        bio: bio?.trim() || undefined,
        avatar: avatar || undefined,
      }
      const updated = await userApi.updateProfile(payload)
      updateUser(updated)
      await queryClient.invalidateQueries({ queryKey: ["user", currentUser.id] })
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      showSuccess("资料已更新")
    } catch {
      showError("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const validateAvatarFile = (file: File) => {
    if (!UPLOAD_CONFIG.avatar.allowedTypes.some((type) => type === file.type)) {
      showError("只支持 JPG、PNG、GIF、WebP 格式的头像")
      return false
    }
    if (file.size > UPLOAD_CONFIG.avatar.maxSize) {
      showError("头像大小不能超过 2MB")
      return false
    }
    return true
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateAvatarFile(file)) {
      event.target.value = ""
      return
    }
    setIsUploadingAvatar(true)
    try {
      const res = await uploadApi.uploadAvatar(file)
      if (!res.url) {
        showError("上传成功但未返回头像 URL")
      } else {
        setAvatar(res.url)
        showSuccess("头像已上传")
      }
    } catch {
      showError("头像上传失败，请重试")
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ""
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 用户信息卡片 */}
      <Card className="mb-8 p-8">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {/* 头像 */}
          <div className="mb-4 md:mb-0">
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.username}
              username={currentUser.username}
              size={96}
              seed={currentUser.id}
              className="border-4 border-blue-500"
            />
          </div>

          {/* 用户信息 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{currentUser.username}</h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">{currentUser.email}</p>
            {currentUser.bio && <p className="mb-4 text-gray-700 dark:text-gray-300">{currentUser.bio}</p>}
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">注册时间</div>
                <div className="font-semibold text-green-700 dark:text-green-300">
                  {formatTime(currentUser.createdAt)}
                </div>
              </div>
              <div className="rounded-lg bg-purple-100 px-4 py-2 dark:bg-purple-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">发帖数</div>
                <div className="font-semibold text-purple-700 dark:text-purple-300">{userPosts.length}</div>
              </div>
              <div className="rounded-lg bg-orange-100 px-4 py-2 dark:bg-orange-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">关注</div>
                <div className="font-semibold text-orange-700 dark:text-orange-300">
                  {currentUser.followingCount ?? 0}
                </div>
              </div>
              <div className="rounded-lg bg-pink-100 px-4 py-2 dark:bg-pink-900">
                <div className="text-sm text-gray-600 dark:text-gray-400">粉丝</div>
                <div className="font-semibold text-pink-700 dark:text-pink-300">{currentUser.followerCount ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab 切换 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {[
              { key: "posts" as Tab, label: "我的帖子" },
              { key: "favorites" as Tab, label: "收藏" },
              { key: "activity" as Tab, label: "动态" },
              { key: "settings" as Tab, label: "设置" },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`relative px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-blue-600 after:rounded-full"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.key === "posts" && <span className="ml-1 text-xs text-gray-400">({userPosts.length})</span>}
                {tab.key === "favorites" && <span className="ml-1 text-xs text-gray-400">({favorites.length})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ProfileTabsContent
        activeTab={activeTab}
        currentUser={currentUser}
        userPosts={userPosts}
        favorites={favorites}
        isFavoritesLoading={isFavoritesLoading}
        favoritesPage={favoritesPage}
        setFavoritesPage={setFavoritesPage}
        connectionsSubTab={connectionsSubTab}
        setConnectionsSubTab={setConnectionsSubTab}
        followingData={followingData}
        followingLoading={followingLoading}
        followingPage={followingPage}
        setFollowingPage={setFollowingPage}
        followersData={followersData}
        followersLoading={followersLoading}
        followersPage={followersPage}
        setFollowersPage={setFollowersPage}
        followingStates={followingStates}
        _handleToggleFollow={handleToggleFollow}
        navigate={navigate}
        _refetchFollowing={refetchFollowing}
        _refetchFollowers={refetchFollowers}
      />

      {/* 动态 */}
      {activeTab === "activity" && (
        <div>
          {/* 动态类型切换、排序和统计信息 */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-4">
              <Button
                size="sm"
                variant={activityType === "all" ? "primary" : "outline"}
                onClick={() => setActivityType("all")}
              >
                全部
              </Button>
              <Button
                size="sm"
                variant={activityType === "posts" ? "primary" : "outline"}
                onClick={() => setActivityType("posts")}
              >
                帖子
              </Button>
              <Button
                size="sm"
                variant={activityType === "comments" ? "primary" : "outline"}
                onClick={() => setActivityType("comments")}
              >
                评论
              </Button>
              <Button
                size="sm"
                variant={activityType === "likes" ? "primary" : "outline"}
                onClick={() => setActivityType("likes")}
              >
                点赞
              </Button>
              <Button
                size="sm"
                variant={activityType === "favorites" ? "primary" : "outline"}
                onClick={() => setActivityType("favorites")}
              >
                收藏
              </Button>
            </div>

            {/* 排序和统计信息 */}
            <div className="flex items-center gap-4">
              <Button size="sm" variant="primary" onClick={() => setActivitySortDesc(!activitySortDesc)}>
                {activitySortDesc ? "最新" : "最旧"}
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                共 {activitiesData?.meta?.total || 0} 条动态
              </div>
            </div>
          </div>

          {isActivitiesLoading ? (
            <LoadingState message="加载动态..." />
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <Card key={activity.id} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 作者头像 */}
                    <Link to={`/users/${activity.author.id}`}>
                      <Avatar
                        src={activity.author.avatar}
                        alt={activity.author.username}
                        username={activity.author.username}
                        size={48}
                        seed={activity.author.id}
                      />
                    </Link>

                    {/* 动态内容 */}
                    <div className="flex-1">
                      {/* 新帖子 */}
                      {activity.type === "POST" && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发布了新帖子</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg bg-gray-50 p-4 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {activity.content}
                              </p>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      {/* 评论 */}
                      {activity.type === "COMMENT" && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发表了评论</span>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.content}</p>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(activity.createdAt)}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 公告 */}
                      {activity.type === "ANNOUNCEMENT" && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 发布了公告</span>
                          </div>
                          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                            <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                              {activity.data.title}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{activity.content}</p>
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              {formatTime(activity.createdAt)}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 点赞 */}
                      {activity.type === "LIKE" && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 点赞了</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      {/* 收藏 */}
                      {activity.type === "FAVORITE" && (
                        <>
                          <div className="mb-2">
                            <Link
                              to={`/users/${activity.author.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                            >
                              {activity.author.nickname || activity.author.username}
                            </Link>
                            <span className="text-gray-600 dark:text-gray-400"> 收藏了</span>
                          </div>
                          <Link to={`/posts/${activity.data.id}`}>
                            <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30">
                              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                                {activity.data.title}
                              </h4>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(activity.createdAt)}
                              </div>
                            </div>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* 分页控件 */}
              <div className="mt-6 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  第 {activityPage} 页，共 {activitiesData?.meta?.totalPages || 1} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={activityPage === 1}
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={activityPage >= (activitiesData?.meta?.totalPages || 1)}
                    onClick={() => setActivityPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="暂无动态" description="关注用户后，这里将展示他们的新帖子和你收到的评论" icon="📊" />
          )}
        </div>
      )}

      {/* 设置 */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* 个人资料 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">个人资料</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">头像</label>
                <div className="flex items-center gap-4">
                  <Avatar src={avatar} alt="头像" username={username} size={80} seed={currentUser.id} />
                  <div className="flex items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="text-sm"
                    />
                    {isUploadingAvatar && <span className="text-sm text-gray-500">上传中...</span>}
                  </div>
                  <Button variant="outline" size="sm" type="button" onClick={() => avatarInputRef.current?.click()}>
                    更换头像
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  昵称
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="请输入昵称"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  昵称将展示给其他用户，用户名仅用于登录不可修改
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邮箱（只读）
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  个人简介
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={200}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="介绍一下自己..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{bio.length}/200</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </Card>

          {/* 偏好设置 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">偏好设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">邮件通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">接收邮件通知</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:after:border-gray-600 dark:after:bg-gray-300 dark:peer-checked:bg-blue-500 dark:peer-focus:ring-blue-800"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">推送通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">接收浏览器推送通知</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:after:border-gray-600 dark:after:bg-gray-300 dark:peer-checked:bg-blue-500 dark:peer-focus:ring-blue-800"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* 账户安全 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">账户安全</h2>
            <div className="space-y-4">
              <button className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                修改密码
              </button>
              <button className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-left text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20">
                删除账户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
