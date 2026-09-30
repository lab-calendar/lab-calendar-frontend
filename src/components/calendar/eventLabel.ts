import type { CalendarEvent } from '../../types/domain'

/**
 * 달력 셀에 표시할 문구를 만든다 (기획서 2.2 표시 데이터 양식).
 *
 * - 과제/연구 관리 — `과제명 (제출 단계)`
 * - 랩실 주기적 일정 — `업무명 (담당 연구원)`
 * - 카드/경비 사용 — `BRL: 저녁` (장부 B열 과제=카드 + D열 구분)
 * - 개인 일정 — `치과 예약 (홍길동)` (KAN-84. 함께 보는 일정이라 누구 것인지 붙는다)
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

  /*
   * 카드만 콜론으로 잇는다 (계약 §6.2). 서버는 대괄호도 콜론도 붙이지 않고
   * 과제명과 구분 원문만 내려주므로, 이어 붙이는 일은 화면 몫이다.
   */
  return event.categoryKey === 'card'
    ? `${event.title}: ${event.detail}`
    : `${event.title} (${event.detail})`
}

/** 이름을 이만큼만 늘어놓고 나머지는 수로 접는다. 스무 명짜리 회의가 실제로 있다. */
const HOVER_NAME_LIMIT = 8

/**
 * 달력 칩에 마우스를 올렸을 때 나올 문구 (KAN-61).
 *
 * 칸이 좁아 칩에는 어느 과제로 무슨 명목이었는지(B열 과제 · D열 구분)까지만
 * 적는다. 정산할 때 정작 궁금한 것은 "누가 있었나"(C열) 인데, 그걸 보려고 매번
 * 일정을 열어야 하면 열 건을 확인하는 데 열 번을 눌러야 한다.
 *
 * 마우스가 없는 환경에서는 이 문구가 보이지 않는다. 그쪽은 칩을 눌러 여는 상세
 * 팝업이 같은 내용을 더 자세히 보여주므로, 여기서 잃는 정보는 없다.
 */
export function formatEventHoverText(event: CalendarEvent): string {
  const label = formatEventLabel(event)
  if (event.participants.length === 0) return label

  const shown = event.participants.slice(0, HOVER_NAME_LIMIT).join(', ')
  const hidden = event.participants.length - HOVER_NAME_LIMIT
  const names = hidden > 0 ? `${shown} 외 ${hidden}명` : shown

  // 줄을 바꿔 둔다 — 한 줄로 이으면 이름이 제목에 붙어 어디까지가 제목인지 흐려진다
  return `${label}\n참석 ${names} · 총 ${event.participants.length}명`
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
