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

/** 두 날짜 사이(양끝 포함)에 걸쳐 있는지 판정한다. 모두 `YYYY-MM-DD` 라 문자열 비교로 충분하다. */
export function overlaps(
  event: { startDate: string; endDate: string },
  range: { from: string; to: string },
): boolean {
  return event.startDate <= range.to && event.endDate >= range.from
}
