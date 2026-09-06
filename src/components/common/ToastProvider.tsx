import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ToastContext,
  type Toast,
  type ToastTone,
} from '../../contexts/ToastContext'
import ToastViewport from './ToastViewport'

/** 실패 알림은 읽고 판단할 시간이 더 필요하다. */
const DURATION_MS: Record<ToastTone, number> = {
  success: 3000,
  error: 6000,
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      setToasts((previous) => [...previous, { id, message, tone }])
      timers.current.push(
        window.setTimeout(() => dismissToast(id), DURATION_MS[tone]),
      )
    },
    [dismissToast],
  )

  // 알림이 사라지기 전에 화면을 떠나면 타이머가 남는다
  useEffect(() => {
    const pending = timers
    return () => pending.current.forEach(window.clearTimeout)
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext>
  )
}

export default ToastProvider
