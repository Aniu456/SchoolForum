import { authApi } from "@/api"
import { useAuthStore } from "@/store/useAuthStore"
import { toast } from "@/utils/toast-utils"
import { io, Socket } from "socket.io-client"

/**
 * WebSocket 服务
 * 管理两个独立的 Socket.IO 连接：
 * 1. 通知 Socket (默认命名空间) - 系统通知、点赞、评论等
 * 2. 聊天 Socket (/chat 命名空间) - 实时私信
 */
class WebSocketService {
  // 🔔 通知 Socket (默认命名空间)
  private notificationSocket: Socket | null = null
  // 💬 聊天 Socket (/chat 命名空间)
  private chatSocket: Socket | null = null
  private isRefreshing = false

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) return false
      const payload = JSON.parse(atob(parts[1])) as { exp?: number }
      if (!payload.exp) return false
      const nowInSeconds = Math.floor(Date.now() / 1000)
      return payload.exp <= nowInSeconds
    } catch {
      return false
    }
  }

  private async handleTokenExpired() {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) {
        useAuthStore.getState().logout()
        toast.error("登录已过期，请重新登录")
        return
      }

      const { accessToken, refreshToken: newRefreshToken } = await authApi.refreshToken({
        refreshToken,
      })

      const authState = useAuthStore.getState()
      authState.setAuth({
        user: authState.user,
        accessToken,
        refreshToken: newRefreshToken,
      })

      this.connect(accessToken)
    } catch {
      useAuthStore.getState().logout()
      toast.error("登录已过期，请重新登录")
    }
  }

  private startHeartbeat(socket: Socket) {
    setInterval(() => {
      if (socket?.connected) {
        socket.emit("ping")
      }
    }, 25000)
  }

  /**
   * 连接两个 Socket 服务
   */
  connect(token: string) {
    const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) || "http://127.0.0.1:30000"

    // 如果 token 已经过期，则优先尝试刷新
    if (this.isTokenExpired(token)) {
      this.handleTokenExpired()
      return
    }

    // ============================================
    // 🔔 通知 Socket (默认命名空间)
    // ============================================
    if (this.notificationSocket) {
      this.notificationSocket.disconnect()
      this.notificationSocket = null
    }

    this.notificationSocket = io(wsUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    this.notificationSocket.on("connect", () => {
      console.log("[NotificationSocket] ✅ Connected")
    })

    this.notificationSocket.on("disconnect", () => {
      console.log("[NotificationSocket] ❌ Disconnected")
    })

    // 调试：监听所有事件
    this.notificationSocket.onAny((eventName, ...args) => {
      if (import.meta.env.DEV) {
        console.log("[NotificationSocket] Event:", eventName, args)
      }
    })

    this.notificationSocket.on("connect_error", (error: any) => {
      console.error("[NotificationSocket] Connection error:", error)

      const raw = error
      const nestedMessage =
        raw?.message || raw?.data?.message || raw?.data || raw?.toString?.() || String(raw)
      const message =
        typeof nestedMessage === "string" ? nestedMessage : JSON.stringify(nestedMessage)

      if (!this.isRefreshing && message.includes("jwt expired")) {
        this.isRefreshing = true
        this.handleTokenExpired().finally(() => {
          this.isRefreshing = false
        })
        return
      }

      if (
        message.includes("invalid signature") ||
        message.includes("invalid token") ||
        message.includes("jwt malformed")
      ) {
        useAuthStore.getState().logout()
        toast.error("登录状态已失效，请重新登录")
      }
    })

    this.startHeartbeat(this.notificationSocket)

    // ============================================
    // 💬 聊天 Socket (/chat 命名空间)
    // ============================================
    if (this.chatSocket) {
      this.chatSocket.disconnect()
      this.chatSocket = null
    }

    this.chatSocket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    this.chatSocket.on("connect", () => {
      console.log("[ChatSocket] ✅ Connected")
    })

    this.chatSocket.on("disconnect", () => {
      console.log("[ChatSocket] ❌ Disconnected")
    })

    // 调试：监听所有事件
    this.chatSocket.onAny((eventName, ...args) => {
      if (import.meta.env.DEV) {
        console.log("[ChatSocket] Event:", eventName, args)
      }
    })

    this.chatSocket.on("connect_error", (error: any) => {
      console.error("[ChatSocket] Connection error:", error)

      const raw = error
      const nestedMessage =
        raw?.message || raw?.data?.message || raw?.data || raw?.toString?.() || String(raw)
      const message =
        typeof nestedMessage === "string" ? nestedMessage : JSON.stringify(nestedMessage)

      if (!this.isRefreshing && message.includes("jwt expired")) {
        this.isRefreshing = true
        this.handleTokenExpired().finally(() => {
          this.isRefreshing = false
        })
        return
      }

      if (
        message.includes("invalid signature") ||
        message.includes("invalid token") ||
        message.includes("jwt malformed")
      ) {
        useAuthStore.getState().logout()
        toast.error("登录状态已失效，请重新登录")
      }
    })

    this.startHeartbeat(this.chatSocket)
  }

  // ============================================
  // 通知 Socket 订阅方法
  // ============================================

  onNotification(callback: (notification: any) => void) {
    this.notificationSocket?.on("notification:new", callback)
  }

  subscribeNotification(callback: (notification: any) => void) {
    if (!this.notificationSocket) return () => undefined
    const handler = (data: any) => callback(data)
    this.notificationSocket.on("notification:new", handler)
    return () => {
      this.notificationSocket?.off("notification:new", handler)
    }
  }

  onLike(callback: (data: any) => void) {
    this.notificationSocket?.on("like", callback)
  }

  onComment(callback: (data: any) => void) {
    this.notificationSocket?.on("comment", callback)
  }

  onReply(callback: (data: any) => void) {
    this.notificationSocket?.on("reply", callback)
  }

  onPost(callback: (data: any) => void) {
    this.notificationSocket?.on("post:new", callback)
  }

  onPostUpdate(callback: (data: any) => void) {
    this.notificationSocket?.on("post:update", callback)
  }

  onPostDelete(callback: (data: any) => void) {
    this.notificationSocket?.on("post:delete", callback)
  }

  onAnnouncement(callback: (data: any) => void) {
    this.notificationSocket?.on("announcement:new", callback)
  }

  onFollow(callback: (data: any) => void) {
    this.notificationSocket?.on("follow", callback)
  }

  onUnfollow(callback: (data: any) => void) {
    this.notificationSocket?.on("unfollow", callback)
  }

  onUserOnline(callback: (data: { userId: string; username: string }) => void) {
    this.notificationSocket?.on("user:online", callback)
  }

  onUserOffline(callback: (data: { userId: string; username: string }) => void) {
    this.notificationSocket?.on("user:offline", callback)
  }

  // ============================================
  // 聊天 Socket 订阅方法
  // ============================================

  /**
   * 监听新私信 (实时)
   */
  onNewMessage(callback: (data: { message: any; sender: any }) => void) {
    this.chatSocket?.on("chat:message_created", callback)
  }

  /**
   * 监听私信未读数更新
   */
  onChatUnreadCount(callback: (data: { count: number }) => void) {
    this.chatSocket?.on("chat:unread_count", callback)
  }

  /**
   * 监听对方正在输入
   */
  onUserTyping(callback: (data: { userId: string; conversationId: string }) => void) {
    this.chatSocket?.on("chat:user_typing", callback)
  }

  /**
   * 加入聊天房间
   */
  joinConversation(conversationId: string) {
    this.chatSocket?.emit("chat:join", { conversationId })
  }

  /**
   * 离开聊天房间
   */
  leaveConversation(conversationId: string) {
    this.chatSocket?.emit("chat:leave", { conversationId })
  }

  /**
   * 发送正在输入状态
   */
  sendTyping(conversationId: string) {
    this.chatSocket?.emit("chat:typing", { conversationId })
  }

  // ============================================
  // 通用方法
  // ============================================

  markNotificationRead(notificationId: string) {
    this.notificationSocket?.emit("notification:mark_read", { notificationId })
  }

  /**
   * 断开所有 Socket 连接
   */
  disconnect() {
    this.notificationSocket?.disconnect()
    this.notificationSocket = null
    this.chatSocket?.disconnect()
    this.chatSocket = null
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      notificationConnected: this.notificationSocket?.connected ?? false,
      chatConnected: this.chatSocket?.connected ?? false,
    }
  }
}

const websocketService = new WebSocketService()

export default websocketService
