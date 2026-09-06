import { addDays } from '../../utils/date'

/**
 * FullCalendar 가 알려준 기간을 도메인 날짜로 되돌린다.
 *
 * FullCalendar 의 종일 일정에서 `end` 는 배타적이라 표시 마지막 날의 다음 날이다.
 * 그대로 저장하면 일정이 하루씩 늘어난다.
 */
export function datesFromCalendarRange(
  startStr: string,
  endStr: string | null | undefined,
): { startDate: string; endDate: string } {
  const startDate = startStr.slice(0, 10)
  const endDate = endStr ? addDays(endStr.slice(0, 10), -1) : startDate

  return { startDate, endDate }
}
