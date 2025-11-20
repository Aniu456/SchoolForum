import { Suspense, useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import { Navbar, Footer, LoadingState, ErrorBoundary } from '@/components'
import { ToastProvider } from '@/utils/toast'
import { QueryProvider } from '@/components'
import { routes } from '@/routes'
import websocketService from '@/services/websocket'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { toast } from '@/utils/toast-utils'

export default function App() {
  const element = useRoutes(routes)

  const { isAuthenticated, accessToken } = useAuthStore()
  const { incrementUnreadNotifications } = useUIStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      websocketService.connect(accessToken)

      websocketService.onNotification((notification) => {
        const title = notification?.title || '收到新通知'
        const content = notification?.content
        toast.info(content ? `${title}: ${content}` : title)
        incrementUnreadNotifications()
      })
    }

    return () => {
      websocketService.disconnect()
    }
  }, [isAuthenticated, accessToken, incrementUnreadNotifications])

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <Navbar />
          <main className="min-h-screen">
            <Suspense fallback={<LoadingState message="加载中..." />}>{element}</Suspense>
          </main>
          <Footer />
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
