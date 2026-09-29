import { apiClient } from './client'
import type {
  CardImportHistoryEntry,
  CardImportMonth,
  CardImportProblem,
  CardImportResult,
  CardImportSkippedSheet,
  CardImportTotals,
} from '../types/domain'

/**
 * 카드 내역 엑셀 가져오기 API (KAN-54 설계 §6.2).
 *
 * 올리기는 두 번 부른다 — 먼저 `dryRun` 으로 미리보기를 받고, 사용자가 확인하면
 * **같은 파일과 미리보기에서 받은 토큰**으로 다시 부른다. 파일은 서버에 남지 않아
 * 두 번째 호출도 파일을 실어 보내야 한다.
 */

type ApiResponse<T> = { data: T }

/** 설계 §6.2 의 응답. null 이 올 자리가 없어 도메인 타입과 모양이 같다. */
type CardImportDto = {
  dryRun: boolean
  previewToken: string
  fileName: string
  months: CardImportMonth[]
  skippedSheets: CardImportSkippedSheet[]
  problems: CardImportProblem[]
  totals: CardImportTotals
}

const IMPORTS_PATH = '/api/card-expenses/imports'

function toResult(dto: CardImportDto): CardImportResult {
  return dto
}

/**
 * 미리보기. 아무것도 저장하지 않고 무엇이 바뀔지만 계산한다.
 *
 * 파일 오류(.xlsx 아님, 읽을 월 시트 없음, 머리글 불일치)는 400, 5MB 초과는 413 이다.
 * 둘 다 서버가 문구를 주므로 화면은 그대로 보여주면 된다.
 */
export async function previewCardImport(file: File): Promise<CardImportResult> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await apiClient.post<ApiResponse<CardImportDto>>(
    IMPORTS_PATH,
    form,
    { params: { dryRun: true } },
  )
  return toResult(data.data)
}

/**
 * 반영. 미리보기에서 받은 토큰을 함께 보낸다.
 *
 * 토큰이 만료됐거나 파일·DB 가 그새 바뀌면 409 `PREVIEW_STALE` 로 거절된다. 그때는
 * 미리보기부터 다시 받아야 하며, 업무 데이터는 그대로다. 반영할 달이 하나도 없으면
 * 422 `NO_APPLICABLE_MONTHS` 다.
 */
export async function applyCardImport(
  file: File,
  previewToken: string,
): Promise<CardImportResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('previewToken', previewToken)

  const { data } = await apiClient.post<ApiResponse<CardImportDto>>(
    IMPORTS_PATH,
    form,
    { params: { dryRun: false } },
  )
  return toResult(data.data)
}

/** 최근 업로드 이력 (KAN-60). */
export async function fetchCardImports(
  limit = 20,
): Promise<CardImportHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<CardImportHistoryEntry[]>>(
    IMPORTS_PATH,
    { params: { limit } },
  )
  return data.data
}

/** 미리보기를 다시 받아야 하는 거절인지 (설계 §6.2). */
export function isPreviewStale(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'PREVIEW_STALE'
  )
}
