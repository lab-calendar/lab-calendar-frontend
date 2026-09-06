import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageFromError } from '../api/errorMessage'
import {
  createEvent,
  deleteEvent,
  updateEvent,
  type EventInput,
} from '../api/events'
import { useToast } from '../contexts/ToastContext'
import { queryKeys } from './queryKeys'

/**
 * 일정을 만들거나 고친다.
 *
 * 성공하면 기간별로 나뉜 일정 쿼리를 전부 무효화한다. 저장한 일정이 지금 보고
 * 있는 달 밖으로 옮겨질 수도 있어, 특정 기간만 갱신하면 어긋난다.
 *
 * 결과 알림은 훅에서 낸다. 폼뿐 아니라 캘린더에서 드래그로 저장하는 경로도
 * 있어서, 호출하는 쪽마다 따로 붙이면 빠뜨리는 곳이 생긴다.
 */
export function useSaveEvent() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: EventInput }) =>
      id === null ? createEvent(input) : updateEvent(id, input),
    onSuccess: (_event, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      showToast(id === null ? '일정을 등록했습니다.' : '일정을 수정했습니다.')
    },
    onError: (error) => {
      showToast(`일정을 저장하지 못했습니다. ${messageFromError(error)}`, 'error')
    },
  })
}

/** 일정을 지운다. 성공하면 저장과 마찬가지로 기간별 쿼리를 전부 무효화한다. */
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      showToast('일정을 삭제했습니다.')
    },
    onError: (error) => {
      showToast(`일정을 삭제하지 못했습니다. ${messageFromError(error)}`, 'error')
    },
  })
}
