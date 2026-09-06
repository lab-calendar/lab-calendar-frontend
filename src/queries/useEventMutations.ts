import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, updateEvent, type EventInput } from '../api/events'
import { queryKeys } from './queryKeys'

/**
 * 일정을 만들거나 고친다.
 *
 * 성공하면 기간별로 나뉜 일정 쿼리를 전부 무효화한다. 저장한 일정이 지금 보고
 * 있는 달 밖으로 옮겨질 수도 있어, 특정 기간만 갱신하면 어긋난다.
 */
export function useSaveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: EventInput }) =>
      id === null ? createEvent(input) : updateEvent(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
    },
  })
}
