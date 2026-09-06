import type { CalendarEvent } from '../../types/domain'

/**
 * 달력에 아무것도 안 보일 때 보여줄 안내.
 *
 * "이번 달에 일정이 없다"와 "필터에 가려졌다"는 사용자가 해야 할 일이 다르다.
 * 전자는 등록해야 하고, 후자는 필터를 풀어야 한다.
 */
export function emptyNoteFor(
  events: CalendarEvent[] | undefined,
  visibleCount: number,
): string | null {
  if (events === undefined || visibleCount > 0) return null

  return events.length === 0
    ? '이번 달에 등록된 일정이 없습니다.'
    : '선택한 카테고리에 해당하는 일정이 없습니다.'
}
