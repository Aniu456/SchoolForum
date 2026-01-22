import { Suspense, useEffect } from "react";
import { useRoutes } from "react-router-dom";
import { Navbar, Footer, LoadingState, ErrorBoundary } from "@/components";
import { ToastProvider } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { routes } from "@/routes";
import websocketService from "@/services/websocket";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { toast } from "@/utils/toast-utils";
import { notificationApi } from "@/api";

export default function App() {
  const element = useRoutes(routes);

  const { isAuthenticated, accessToken, user } = useAuthStore();
  const {
    incrementUnreadNotifications,
    activeConversationId,
    activePostId,
    setUnreadNotifications,
  } = useUIStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubscribeNotification: (() => void) | undefined;

    if (isAuthenticated && accessToken) {
      websocketService.connect(accessToken);

      unsubscribeNotification = websocketService.subscribeNotification(
        async (notification) => {
          // 忽略自己发出的通知（私信发送者等）
          if (notification?.senderId && notification.senderId === user?.id) {
            return;
          }
          const title = notification?.title || "收到新通知";
          const content = notification?.content;

          // 检测是否在当前活跃的私信会话
          const isActiveChat =
            notification?.type === "SYSTEM" &&
            notification?.relatedId &&
            activeConversationId &&
            notification.relatedId === activeConversationId;

          // 检测是否在当前活跃的帖子详情页
          const isActivePost =
            ["LIKE", "COMMENT", "REPLY"].includes(notification?.type) &&
            notification?.relatedId &&
            activePostId &&
            notification.relatedId === activePostId;

          // 私信且在当前会话：直接批量已读并刷新消息，不增加未读、也不弹 Toast
          if (isActiveChat && notification.relatedId) {
            await notificationApi.markByRelated(
              notification.relatedId,
              "SYSTEM",
            );
            const unread = await notificationApi.getUnreadCount();
            setUnreadNotifications(unread.unreadCount || 0);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread"],
            });
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({
              queryKey: ["messages", notification.relatedId],
            });
            return;
          }

          // 帖子相关通知且在当前帖子：直接批量已读并刷新帖子数据，不增加未读、也不弹 Toast
          if (isActivePost && notification.relatedId) {
            await notificationApi.markByRelated(
              notification.relatedId,
              notification.type,
            );
            const unread = await notificationApi.getUnreadCount();
            setUnreadNotifications(unread.unreadCount || 0);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread"],
            });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({
              queryKey: ["post", notification.relatedId],
            });
            queryClient.invalidateQueries({ queryKey: ["comments"] });
            return;
          }

          // 默认流程：提示并累加未读
          toast.info(content ? `${title}: ${content}` : title);
          incrementUnreadNotifications();

          // 刷新通知列表与计数
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread"],
          });

          // 类型定向刷新
          if (notification?.relatedId) {
            if (notification.type === "SYSTEM") {
              queryClient.invalidateQueries({ queryKey: ["messages"] });
              queryClient.invalidateQueries({
                queryKey: ["messages", notification.relatedId],
              });
            } else if (notification.type === "NEW_FOLLOWER") {
              queryClient.invalidateQueries({ queryKey: ["users"] });
              queryClient.invalidateQueries({ queryKey: ["followers"] });
              queryClient.invalidateQueries({ queryKey: ["following"] });
            } else if (
              notification.type === "COMMENT" ||
              notification.type === "REPLY"
            ) {
              queryClient.invalidateQueries({ queryKey: ["posts"] });
              queryClient.invalidateQueries({
                queryKey: ["post", notification.relatedId],
              });
              queryClient.invalidateQueries({ queryKey: ["comments"] });
            } else if (notification.type === "LIKE") {
              queryClient.invalidateQueries({ queryKey: ["posts"] });
              queryClient.invalidateQueries({
                queryKey: ["post", notification.relatedId],
              });
            }
          }
        },
      );

      websocketService.onPost(() => {
        // 新帖推送：刷新列表和通知
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["posts", "infinite"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });

      websocketService.onAnnouncement(() => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      });

      // ============================================
      // 💬 评论实时更新
      // ============================================

      websocketService.onComment((data) => {
        console.log("[App] 新评论:", data);
        // 刷新评论列表
        queryClient.invalidateQueries({ queryKey: ["comments"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        // 如果是针对特定帖子的评论，刷新该帖子
        if (data?.postId) {
          queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
        }
      });

      websocketService.onLike((data) => {
        console.log("[App] 新点赞:", data);
        // 刷新相关数据
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        if (data?.postId) {
          queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
        }
      });

      // 监听新回复
      websocketService.onReply((data) => {
        console.log("[App] 新回复:", data);
        queryClient.invalidateQueries({ queryKey: ["comments"] });
        if (data?.postId) {
          queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
        }
      });

      // 监听帖子更新
      websocketService.onPostUpdate((data) => {
        console.log("[App] 帖子更新:", data);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        if (data?.postId) {
          queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
        }
      });

      // 监听帖子删除
      websocketService.onPostDelete((data) => {
        console.log("[App] 帖子删除:", data);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        if (data?.postId) {
          queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
        }
      });

      // 监听关注事件
      websocketService.onFollow((data) => {
        console.log("[App] 新关注:", data);
        queryClient.invalidateQueries({ queryKey: ["followers"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
        if (data?.userId) {
          queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
      });

      // 监听取消关注事件
      websocketService.onUnfollow((data) => {
        console.log("[App] 取消关注:", data);
        queryClient.invalidateQueries({ queryKey: ["followers"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
        if (data?.userId) {
          queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
      });

      // 监听用户上线
      websocketService.onUserOnline((data) => {
        console.log("[App] 用户上线:", data);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        if (data?.userId) {
          queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
      });

      // 监听用户下线
      websocketService.onUserOffline((data) => {
        console.log("[App] 用户下线:", data);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        if (data?.userId) {
          queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
      });

      // ============================================
      // 💬 聊天 Socket 事件处理
      // ============================================

      // 监听新私信 (实时)
      websocketService.onNewMessage((data) => {
        console.log("[App] 新私信:", data);
        // 刷新消息列表
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({
          queryKey: ["messages", data.message?.conversationId],
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });

      // 监听私信未读数更新
      websocketService.onChatUnreadCount((data) => {
        console.log("[App] 私信未读数更新:", data.count);
        // TODO: 更新私信未读数状态
      });

      // 监听对方正在输入
      websocketService.onUserTyping((data) => {
        console.log("[App] 对方正在输入:", data);
        // TODO: 如果在聊天窗口，显示"对方正在输入..."提示
      });

      return () => {
        websocketService.disconnect();
        unsubscribeNotification?.();
      };
    }

    return () => {
      websocketService.disconnect();
    };
  }, [
    isAuthenticated,
    accessToken,
    incrementUnreadNotifications,
    queryClient,
    activeConversationId,
    activePostId,
    setUnreadNotifications,
    user?.id,
  ]);
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Navbar />
        <main className="min-h-screen">
          <Suspense fallback={<LoadingState message="加载中..." />}>
            {element}
          </Suspense>
        </main>
        <Footer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
