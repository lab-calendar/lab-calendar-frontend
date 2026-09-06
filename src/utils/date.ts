/** `YYYY-MM-DD` 문자열 다루기. */

/**
 * 날짜에 일수를 더한다.
 *
 * 로컬 타임존에서 파싱하면 자정 경계에서 하루가 밀릴 수 있어 UTC 기준으로 계산한다.
 */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function partsOf(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return { year, month, day, weekday }
}

/**
 * 일정 기간을 사람이 읽는 문구로 만든다.
 * - 하루: `2026년 9월 10일 (목)`
 * - 기간: `2026년 9월 8일 (화) ~ 9월 26일 (토)`
 * - 해가 바뀌면 끝 날짜에도 연도를 붙인다.
 */
export function formatEventPeriod(startDate: string, endDate: string): string {
  const start = partsOf(startDate)
  const startText = `${start.year}년 ${start.month}월 ${start.day}일 (${start.weekday})`

  if (startDate === endDate) return startText

  const end = partsOf(endDate)
  const endText =
    start.year === end.year
      ? `${end.month}월 ${end.day}일 (${end.weekday})`
      : `${end.year}년 ${end.month}월 ${end.day}일 (${end.weekday})`

  return `${startText} ~ ${endText}`
}

/** 두 날짜 사이(양끝 포함)에 걸쳐 있는지 판정한다. 모두 `YYYY-MM-DD` 라 문자열 비교로 충분하다. */
export function overlaps(
  event: { startDate: string; endDate: string },
  range: { from: string; to: string },
): boolean {
  return event.startDate <= range.to && event.endDate >= range.from
}
