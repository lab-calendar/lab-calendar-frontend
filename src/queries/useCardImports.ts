import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyCardImport,
  fetchCardImports,
  previewCardImport,
} from '../api/cardImports'
import { messageFromError } from '../api/errorMessage'
import { useToast } from '../contexts/ToastContext'
import type { CardImportResult } from '../types/domain'
import { queryKeys } from './queryKeys'

/**
 * 지난 업로드 이력 (KAN-60).
 *
 * 카드 데이터라 편집 등급만 받을 수 있다(설계 §6.2). 조회 등급에서는 부르지 않는다.
 */
export function useCardImports(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cardImports,
    queryFn: () => fetchCardImports(),
    enabled,
  })
}

/** 미리보기. 실패해도 토스트만 내고, 화면은 파일을 다시 고르게 둔다. */
export function usePreviewCardImport() {
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (file: File) => previewCardImport(file),
    onError: (error) => {
      showToast(`파일을 읽지 못했습니다. ${messageFromError(error)}`, 'error')
    },
  })
}

/**
 * 반영.
 *
 * 성공하면 일정과 이력을 함께 무효화한다 — 반영의 결과가 달력의 카드 막대다.
 * 실패 처리는 화면이 한다: `PREVIEW_STALE` 이면 미리보기부터 다시 받아야 해서
 * 토스트 하나로 끝낼 수 없다.
 */
export function useApplyCardImport() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ file, previewToken }: { file: File; previewToken: string }) =>
      applyCardImport(file, previewToken),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cardImports })

      showToast(describeApplied(result))
    },
  })
}

/**
 * 반영 결과 한 줄.
 *
 * 사라진 건수를 빼놓지 않는다 — 달 단위로 갈아 끼우는 작업이라, 추가만 알리면
 * 무엇이 없어졌는지 모르는 채로 지나간다.
 */
function describeApplied(result: CardImportResult): string {
  const { added, removed, blockedMonths } = result.totals

  const parts = [`카드 내역 ${added}건을 추가했습니다.`]
  if (removed > 0) parts.push(`${removed}건이 사라졌습니다.`)
  if (blockedMonths > 0) {
    parts.push(`오류가 있는 ${blockedMonths}개 달은 그대로 두었습니다.`)
  }

  return parts.join(' ')
}
