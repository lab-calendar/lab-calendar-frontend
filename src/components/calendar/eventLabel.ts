import type { CalendarEvent } from '../../types/domain'

/**
 * 달력 셀에 표시할 문구를 만든다 (기획서 2.2 표시 데이터 양식).
 *
 * - 과제/연구 관리 — `과제명 (제출 단계)`
 * - 랩실 주기적 일정 — `업무명 (담당 연구원)`
 * - 카드/경비 사용 — `카드종류: 지출목적`
 */
export function formatEventLabel(event: CalendarEvent): string {
  if (!event.detail) return event.title

  return event.categoryKey === 'card'
    ? `${event.title}: ${event.detail}`
    : `${event.title} (${event.detail})`
}
