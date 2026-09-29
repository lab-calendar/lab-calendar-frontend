import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCardSync, syncCardExpenses } from '../api/cardExpenses'
import { messageFromError } from '../api/errorMessage'
import { useToast } from '../contexts/ToastContext'
import { queryKeys } from './queryKeys'

/**
 * 카드 내역 동기화의 마지막 결과 (KAN-60).
 *
 * 조회 등급은 카드 지출을 아예 받지 못하므로(KAN-35) 이 쿼리도 부르지 않는다.
 * `enabled` 로 막지 않으면 화면에 쓸 데도 없는 403 이 매번 날아간다.
 */
export function useCardSync(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cardSync,
    queryFn: fetchCardSync,
    enabled,
  })
}

/**
 * 지금 당장 동기화한다 (KAN-59).
 *
 * 성공하면 일정 쿼리까지 무효화한다 — 동기화의 결과가 달력의 카드 막대이므로,
 * 동기화 상태만 갱신하면 "몇 건 반영했다"는 숫자와 화면이 어긋난다.
 */
export function useSyncCardExpenses() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: syncCardExpenses,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.cardSync, result)
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })

      showToast(describeResult(result.processedCount, result.skippedCount))
    },
    onError: (error) => {
      /*
       * 실패해도 마지막 결과를 다시 받아 둔다. 서버가 실패를 이력에 적어 두므로
       * (KAN-60) 그 값이 화면의 경고 배너가 된다 — 토스트는 사라지지만 배너는 남는다.
       */
      void queryClient.invalidateQueries({ queryKey: queryKeys.cardSync })

      showToast(
        `카드 내역을 동기화하지 못했습니다. ${messageFromError(error)}`,
        'error',
      )
    },
  })
}

/** 건너뛴 행이 있으면 함께 알린다. 조용히 빠지면 장부가 틀린 줄도 모른다. */
function describeResult(processed: number, skipped: number): string {
  const done = `카드 내역 ${processed}건을 반영했습니다.`
  return skipped > 0 ? `${done} ${skipped}건은 양식이 맞지 않아 건너뛰었습니다.` : done
}
