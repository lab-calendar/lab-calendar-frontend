import { createContext, use } from 'react'

export type ToastTone = 'success' | 'error'

export type Toast = {
  id: number
  message: string
  tone: ToastTone
}

export type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** 저장·삭제 결과를 알리는 짧은 알림. */
export function useToast(): ToastContextValue {
  const value = use(ToastContext)
  if (!value) {
    throw new Error('useToast 는 ToastProvider 안에서만 쓸 수 있습니다.')
  }
  return value
}
