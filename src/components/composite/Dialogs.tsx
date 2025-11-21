import { Modal, Button } from '../ui'

function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>
}

type ConfirmType = 'default' | 'danger' | 'warning'

const typeStyles: Record<ConfirmType, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
  danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  warning: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600',
}

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
  type?: ConfirmType
  children?: React.ReactNode
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onClose,
  type = 'default',
  children,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {description && (
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      )}
      {children}
      <DialogActions>
        <Button variant="outline" size="sm" onClick={onClose}>{cancelText}</Button>
        <Button size="sm" className={typeStyles[type]} onClick={handleConfirm}>{confirmText}</Button>
      </DialogActions>
    </Modal>
  )
}
