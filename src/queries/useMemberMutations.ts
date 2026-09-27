import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'
import { messageFromError } from '../api/errorMessage'
import { createMember, deleteMember, updateMember } from '../api/members'
import { useToast } from '../contexts/ToastContext'
import type { MemberInput } from '../types/domain'
import { queryKeys } from './queryKeys'

/**
 * 구성원을 등록하거나 고친다 (KAN-74).
 *
 * 이름을 고쳐도 지난 일정의 참석자 이름은 그대로다. 일정은 이름을 문자열로 복사해
 * 두기 때문이다(계약 §2.1). 명단만 무효화하면 된다.
 */
export function useSaveMember() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: MemberInput }) =>
      id === null ? createMember(input) : updateMember(id, input),
    onSuccess: (_member, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members })
      showToast(id === null ? '구성원을 등록했습니다.' : '구성원을 수정했습니다.')
    },
    onError: (error) => {
      showToast(
        `구성원을 저장하지 못했습니다. ${messageFromError(error)}`,
        'error',
      )
    },
  })
}

/**
 * 구성원을 지운다.
 *
 * 일정에 한 번이라도 들어간 사람은 서버가 409 로 막는다. 그대로 "지금 상태에서는
 * 할 수 없습니다"라고만 하면 왜인지, 그럼 어떻게 해야 하는지 알 수 없어서 이 화면이
 * 아는 이유로 바꿔 말해 준다.
 */
export function useDeleteMember() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members })
      showToast('구성원을 삭제했습니다.')
    },
    onError: (error) => {
      const reason =
        error instanceof ApiError && error.kind === 'CONFLICT'
          ? '일정에 참석 기록이 있어 지울 수 없습니다. 재직 여부를 꺼 두면 고르는 자리에서만 사라집니다.'
          : messageFromError(error)
      showToast(`구성원을 삭제하지 못했습니다. ${reason}`, 'error')
    },
  })
}
