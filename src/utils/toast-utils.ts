export type ToastType = 'success' | 'error' | 'warning' | 'info'

let globalShowToast: ((message: string, type?: ToastType, duration?: number) => void) | null = null

export function setGlobalToast(showToast: (message: string, type?: ToastType, duration?: number) => void) {
  globalShowToast = showToast
}

export const toast = {
  success: (message: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'success', duration)
  },
  error: (message: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'error', duration)
  },
  warning: (message: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'warning', duration)
  },
  info: (message: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'info', duration)
  },
}