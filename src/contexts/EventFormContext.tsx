import { createContext, use } from 'react'
import type { CalendarEvent } from '../types/domain'

export type EventFormContextValue = {
  /** null 이면 새 일정 등록 모드 */
  editingEvent: CalendarEvent | null
  /** 상세 팝업 등에서 수정을 시작한다. 좁은 화면에서는 제어 영역도 함께 연다. */
  startEdit: (event: CalendarEvent) => void
  /** 등록 모드로 되돌린다. */
  startCreate: () => void
}

export const EventFormContext = createContext<EventFormContextValue | null>(null)

export function useEventForm(): EventFormContextValue {
  const value = use(EventFormContext)
  if (!value) {
    throw new Error('useEventForm 은 EventFormContext 안에서만 쓸 수 있습니다.')
  }
  return value
}
