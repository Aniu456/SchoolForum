import { io, Socket } from 'socket.io-client'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from '@/utils/toast-utils'

class WebSocketService {
    private socket: Socket | null = null
    private isRefreshing = false

    private isTokenExpired(token: string): boolean {
        try {
            const parts = token.split('.')
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
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                useAuthStore.getState().logout()
                toast.error('登录已过期，请重新登录')
                return
            }

            const { accessToken, refreshToken: newRefreshToken } = await authApi.refreshToken({ refreshToken })

            const authState = useAuthStore.getState()
            authState.setAuth({
                user: authState.user,
                accessToken,
                refreshToken: newRefreshToken,
            })

            this.connect(accessToken)
        } catch {
            useAuthStore.getState().logout()
            toast.error('登录已过期，请重新登录')
        }
    }

    private startHeartbeat() {
        setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('ping')
            }
        }, 25000)
    }

    connect(token: string) {
        const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) || 'http://127.0.0.1:3000'

        // 如果 token 已经过期，则优先尝试刷新，而不是直接用旧 token 建立连接
        if (this.isTokenExpired(token)) {
            this.handleTokenExpired()
            return
        }

        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }

        this.socket = io(wsUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        })

        this.socket.on('connect', () => {
            if (import.meta.env.DEV) {
                console.log('WebSocket connected')
            }
        })

        this.socket.on('disconnect', () => {
            if (import.meta.env.DEV) {
                console.log('WebSocket disconnected')
            }
        })

        this.socket.on('connect_error', (error: any) => {
            if (import.meta.env.DEV) {
                console.error('WebSocket connection error:', error)
            }

            const raw = error
            const nestedMessage =
                raw?.message || raw?.data?.message || raw?.data || raw?.toString?.() || String(raw)
            const message = typeof nestedMessage === 'string' ? nestedMessage : JSON.stringify(nestedMessage)

            if (!this.isRefreshing && message.includes('jwt expired')) {
                this.isRefreshing = true
                this.handleTokenExpired().finally(() => {
                    this.isRefreshing = false
                })
                return
            }

            // 其它明显的鉴权错误，直接登出，避免无限重连
            if (
                message.includes('invalid signature') ||
                message.includes('invalid token') ||
                message.includes('jwt malformed')
            ) {
                useAuthStore.getState().logout()
                toast.error('登录状态已失效，请重新登录')
            }
        })

        this.startHeartbeat()
    }

    onNotification(callback: (notification: any) => void) {
        this.socket?.on('notification:new', callback)
    }

    onLike(callback: (data: any) => void) {
        this.socket?.on('like', callback)
    }

    onComment(callback: (data: any) => void) {
        this.socket?.on('comment', callback)
    }

    markNotificationRead(notificationId: string) {
        this.socket?.emit('notification:mark_read', { notificationId })
    }

    disconnect() {
        this.socket?.disconnect()
        this.socket = null
    }
}

const websocketService = new WebSocketService()

export default websocketService
