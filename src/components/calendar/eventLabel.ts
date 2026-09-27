import type { CalendarEvent } from '../../types/domain'

/**
 * 달력 셀에 표시할 문구를 만든다 (기획서 2.2 표시 데이터 양식).
 *
 * - 과제/연구 관리 — `과제명 (제출 단계)`
 * - 랩실 주기적 일정 — `업무명 (담당 연구원)`
 * - 카드/경비 사용 — `카드종류: 지출목적`
 *
 * 과제에서 자동으로 만든 준비 기간은 따로 쓴다 (기획서 3.1) —
 * `[작성 요망] 과제명 제출 단계 준비 시작`. 손으로 넣은 과제 일정과 같은 모양이면
 * 누가 챙겨야 하는 막대인지 한눈에 들어오지 않는다.
 */
export function formatEventLabel(event: CalendarEvent): string {
  if (event.source === 'AUTO_GENERATED' && event.categoryKey === 'project') {
    return preparationLabel(event)
  }

  if (!event.detail) return event.title

  return event.categoryKey === 'card'
    ? `${event.title}: ${event.detail}`
    : `${event.title} (${event.detail})`
}

/**
 * 서버가 저장해 둔 제목과 같은 규칙이다 (백엔드 PreparationEvent).
 *
 * 그 제목을 그대로 받아 쓰지 않는 이유 — 일정 응답의 `title`·`detail` 은 과제 행에서
 * 그때그때 읽어 온 과제명·제출 단계라서(계약 §6.2), 과제 이름을 바꾸면 바로 따라온다.
 * 달력의 임박 강조도 이 `title` 로 과제를 찾으므로 응답 값은 건드리지 않는다.
 */
function preparationLabel(event: CalendarEvent): string {
  const stage = event.detail?.trim()
  const subject = stage ? `${event.title} ${stage}` : event.title
  return `[작성 요망] ${subject} 준비 시작`
}
