import { useMutation, useQueryClient } from '@tanstack/react-query'
import { describeSyncFailure, runSheetsSync } from '../api/sheetsSync'
import { isSheetsSyncDisabled } from '../api/sheetsSync'
import { messageFromError } from '../api/errorMessage'
import { useToast } from '../contexts/ToastContext'
import type { SheetsSyncResult } from '../types/domain'
import { queryKeys } from './queryKeys'

/**
 * 시트에서 지금 가져오기 (KAN-88).
 *
 * 성공하면 일정과 이력을 함께 무효화한다 — 이 동작의 결과가 달력의 카드 막대이고,
 * 회차 한 줄이 이력에 남기 때문이다.
 *
 * 서버가 "반영하지 않았다"고 답하는 경우(안전장치·권한 상실 등)는 실패가 아니라
 * 정상 응답이다. 토스트로 이유를 알리고, 화면이 같은 내용을 남겨 둔다.
 */
export function useSheetsSync() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: runSheetsSync,
    onSuccess: (result) => {
      if (!result.applied) {
        showToast(describeSyncFailure(result.failure), 'error')
        return
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cardImports })
      showToast(describeApplied(result))
    },
    onError: (error) => {
      if (isSheetsSyncDisabled(error)) {
        // 고장이 아니라 설정이다. 화면이 안내를 남기므로 토스트는 내지 않는다.
        return
      }
      showToast(`시트를 가져오지 못했습니다. ${messageFromError(error)}`, 'error')
    },
  })
}

/**
 * 반영 결과 한 줄.
 *
 * 사라진 건수를 빼놓지 않는다 — 달 단위로 갈아 끼우는 작업이라, 추가만 알리면
 * 무엇이 없어졌는지 모르는 채로 지나간다.
 */
function describeApplied(result: SheetsSyncResult): string {
  const parts = [`시트에서 ${result.added}건을 추가했습니다.`]
  if (result.removed > 0) parts.push(`${result.removed}건이 사라졌습니다.`)
  if (result.braked.length > 0) {
    parts.push(`안전장치가 ${result.braked.length}개 달을 건너뛰었습니다.`)
  }
  return parts.join(' ')
}
