import type { Toast } from '../../contexts/ToastContext'
import styles from './ToastViewport.module.css'

type ToastViewportProps = {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

/**
 * 화면 구석에 쌓이는 알림.
 *
 * 성공은 `status`, 실패는 `alert` 로 알린다. 실패는 하던 일이 안 된 것이라
 * 스크린 리더가 읽던 것을 끊고 먼저 읽어야 한다.
 */
function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.viewport}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={styles.toast}
          data-tone={toast.tone}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.close}
            aria-label="알림 닫기"
            onClick={() => onDismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
