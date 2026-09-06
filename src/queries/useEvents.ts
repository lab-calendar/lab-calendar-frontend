import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '../api/events'
import type { DateRange } from '../types/domain'
import { queryKeys } from './queryKeys'

/**
 * 표시 기간의 일정.
 *
 * 캘린더가 어느 기간을 보여줄지 정하기 전에는 조회하지 않는다.
 * 카테고리 필터는 쿼리 키에 넣지 않는다 — 필터를 바꿀 때마다 다시 받지 않기 위해서다.
 */
export function useEvents(range: DateRange | null) {
  return useQuery({
    queryKey: queryKeys.events.list(range),
    queryFn: () => fetchEvents(range!),
    enabled: range !== null,
  })
}
