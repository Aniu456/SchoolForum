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

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void> | void
}

export function ReportDialog({ isOpen, onClose, onSubmit }: ReportDialogProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const reason = String(formData.get('reason') || '')
    await onSubmit(reason)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="举报内容">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">原因</label>
        <textarea
          name="reason"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          rows={4}
          placeholder="请描述举报原因"
        />
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">提交举报</Button>
        </DialogActions>
      </form>
    </Modal>
  )
}