"use client"

import { Avatar, Button, Card, EmptyState, LoadingState, PostCard } from "@/components"
import { Post } from "@/types"
import React from "react"

interface ProfileTabsContentProps {
  activeTab: string
  currentUser: any
  userPosts: Post[]
  favorites: any[]
  isFavoritesLoading: boolean
  favoritesPage: number
  setFavoritesPage: (page: (prev: number) => number) => void
  connectionsSubTab: "following" | "followers"
  setConnectionsSubTab: (tab: "following" | "followers") => void
  followingData: any
  followingLoading: boolean
  followingPage: number
  setFollowingPage: (page: (prev: number) => number) => void
  followersData: any
  followersLoading: boolean
  followersPage: number
  setFollowersPage: (page: (prev: number) => number) => void
  followingStates: Record<string, boolean>
  _handleToggleFollow: (userId: string, currentlyFollowing: boolean) => void
  navigate: (path: string) => void
  _refetchFollowing: () => void
  _refetchFollowers: () => void
}

function ProfileTabsContent({
  activeTab,
  currentUser,
  userPosts,
  favorites,
  isFavoritesLoading,
  favoritesPage,
  setFavoritesPage,
  connectionsSubTab,
  setConnectionsSubTab,
  followingData,
  followingLoading,
  followingPage,
  setFollowingPage,
  followersData,
  followersLoading,
  followersPage,
  setFollowersPage,
  followingStates,
  _handleToggleFollow: handleToggleFollow,
  navigate,
  _refetchFollowing,
  _refetchFollowers,
}: ProfileTabsContentProps) {
  // 我的帖子
  if (activeTab === "posts") {
    return (
      <div className="space-y-4">
        {userPosts.length > 0 ? (
          userPosts.map((post: Post) => <PostCard key={post.id} post={post} />)
        ) : (
          <EmptyState
            title="还没有发布过帖子"
            description="快去发布你的第一篇帖子吧！"
            icon="📝"
            action={{
              label: "去发帖",
              onClick: () => navigate("/posts/new"),
            }}
          />
        )}
      </div>
    )
  }

  // 收藏
  if (activeTab === "favorites") {
    return (
      <div>
        {isFavoritesLoading ? (
          <LoadingState message="加载收藏..." />
        ) : favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((favorite) => favorite.post && <PostCard key={favorite.id} post={favorite.post} />)}
            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="outline"
                disabled={favoritesPage === 1}
                onClick={() => setFavoritesPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Button variant="outline" onClick={() => setFavoritesPage((p) => p + 1)}>
                下一页
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState title="还没有收藏" description="收藏你喜欢的帖子吧！" icon="⭐" />
        )}
      </div>
    )
  }

  // 关注/粉丝
  if (activeTab === "connections") {
    return (
      <div>
        {/* 子标签切换 */}
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setConnectionsSubTab("following")}
            className={`px-4 py-2 text-sm font-medium transition ${
              connectionsSubTab === "following"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            我的关注 ({currentUser?.followingCount ?? 0})
          </button>
          <button
            onClick={() => setConnectionsSubTab("followers")}
            className={`px-4 py-2 text-sm font-medium transition ${
              connectionsSubTab === "followers"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            我的粉丝 ({currentUser?.followerCount ?? 0})
          </button>
        </div>

        <div>
          {/* 关注列表 */}
          {connectionsSubTab === "following" && (
            <Card className="p-6">
              {followingLoading ? (
                <LoadingState message="加载关注列表..." />
              ) : (followingData as any)?.data?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(followingData as any)?.data?.map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                      >
                        <div
                          className="flex flex-1 cursor-pointer items-center gap-3"
                          onClick={() => navigate(`/users/${u.id}`)}
                        >
                          <Avatar src={u.avatar} alt={u.username} username={u.username} size={40} seed={u.id} />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {u.nickname || u.username}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              关注 {u.followingCount ?? 0} · 粉丝 {u.followerCount ?? 0}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFollow(u.id, true)
                            }}
                          >
                            取消关注
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 分页控件 */}
                  <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      第 {followingPage} 页，共 {(followingData as any)?.meta?.totalPages || 1} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followingPage === 1}
                        onClick={() => setFollowingPage((p) => Math.max(1, p - 1))}
                      >
                        上一页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followingPage >= ((followingData as any)?.meta?.totalPages || 1)}
                        onClick={() => setFollowingPage((p) => p + 1)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="暂无关注" description="快去关注感兴趣的用户吧！" icon="👥" />
              )}
            </Card>
          )}

          {/* 粉丝列表 */}
          {connectionsSubTab === "followers" && (
            <Card className="p-6">
              {followersLoading ? (
                <LoadingState message="加载粉丝列表..." />
              ) : (followersData as any)?.data?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(followersData as any)?.data?.map((u: any) => {
                      // 检查是否互相关注
                      const isFollowingBack =
                        followingStates[u.id] ??
                        ((followingData as any)?.data?.some((f: any) => f.id === u.id) || false)

                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                        >
                          <div
                            className="flex flex-1 cursor-pointer items-center gap-3"
                            onClick={() => navigate(`/users/${u.id}`)}
                          >
                            <Avatar src={u.avatar} alt={u.username} username={u.username} size={40} seed={u.id} />
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {u.nickname || u.username}
                                </div>
                                {isFollowingBack && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    互相关注
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                关注 {u.followingCount ?? 0} · 粉丝 {u.followerCount ?? 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isFollowingBack ? "outline" : "primary"}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFollow(u.id, isFollowingBack)
                              }}
                            >
                              {isFollowingBack ? "已关注" : "关注"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* 分页控件 */}
                  <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      第 {followersPage} 页，共 {(followersData as any)?.meta?.totalPages || 1} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followersPage === 1}
                        onClick={() => setFollowersPage((p) => Math.max(1, p - 1))}
                      >
                        上一页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={followersPage >= ((followersData as any)?.meta?.totalPages || 1)}
                        onClick={() => setFollowersPage((p) => p + 1)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="暂无粉丝" description="发布优质内容吸引粉丝关注吧！" icon="⭐" />
              )}
            </Card>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default React.memo(ProfileTabsContent)
