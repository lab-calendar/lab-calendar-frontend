import { apiClient } from './client'
import { ApiError } from './errors'
import type { SheetsSyncResult } from '../types/domain'

/**
 * 구글 시트에서 지금 가져오기 (KAN-88).
 *
 * 서버가 매시 스스로 도는 일을 사람이 당겨 쓰는 길이다. 시트를 고친 직후에 결과를
 * 보고 싶을 때를 위한 것이라, 미리보기 단계가 없다 — 자동 회차와 같은 길을 타고,
 * 위험한 삭제는 서버의 안전장치가 막는다.
 */

type ApiResponse<T> = { data: T }

const SYNC_PATH = '/api/card-expenses/sheets-sync'

export async function runSheetsSync(): Promise<SheetsSyncResult> {
  const { data } = await apiClient.post<ApiResponse<SheetsSyncResult>>(SYNC_PATH)
  return data.data
}

/** 서버에 시트 연동이 켜져 있지 않은 경우. 고장이 아니라 설정이다. */
export function isSheetsSyncDisabled(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'SHEETS_SYNC_DISABLED'
}

/**
 * 실패 코드를 사람 말로 옮긴다.
 *
 * 서버는 코드만 준다 — 같은 문구를 이력 화면과 로그가 함께 쓰고, 거기에 문장을
 * 실어 보내면 번역이 서버에 묶인다. 무엇을 하러 가야 하는지까지 적는다.
 */
export function describeSyncFailure(code: string | null): string {
  if (code === null) return '동기화에 실패했습니다.'

  switch (code) {
    case 'REMOVAL_LIMIT':
      return '지워질 양이 안전 기준을 넘어 반영하지 않았습니다. 시트가 비어 있지 않은지 확인해 주세요.'
    case 'NO_APPLICABLE_MONTHS':
      return '반영할 수 있는 달이 없습니다. 오류가 있는 달은 그대로 두었습니다.'
    case 'SHEETS_NO_MONTH_TABS':
      return '읽을 월 탭이 없어 아무것도 바꾸지 않았습니다.'
    case 'SHEETS_PERMISSION_DENIED':
      return '시트를 볼 권한이 없습니다. 공유가 해제되었거나 Sheets API 사용 설정이 꺼졌습니다.'
    case 'SHEETS_CREDENTIALS_REJECTED':
      return '서비스 계정 키가 거절되었습니다. 키가 폐기되었거나 서버 시계가 어긋났습니다.'
    case 'SHEETS_CREDENTIALS_INVALID':
      return '서비스 계정 키를 읽을 수 없습니다. 설정을 확인해 주세요.'
    case 'SHEETS_SPREADSHEET_NOT_FOUND':
      return '시트를 찾을 수 없습니다. 문서가 삭제되었거나 ID 가 바뀌었습니다.'
    case 'SHEETS_TEMPORARILY_UNAVAILABLE':
      return '구글이 지금은 응답하지 않습니다. 잠시 후 다시 시도해 주세요.'
    case 'SHEETS_TIMED_OUT':
      return '시트를 읽는 데 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해 주세요.'
    case 'SHEETS_RESPONSE_TOO_LARGE':
      return '시트가 한 번에 읽을 수 있는 크기를 넘었습니다.'
    default:
      // 시트 양식 문제(SHEET_INVALID_LAYOUT 등)는 한 덩어리로 묶는다 — 할 일이 같다
      if (code.startsWith('SHEET_')) {
        return '시트 양식을 읽을 수 없습니다. 월 탭의 머리글과 이름을 확인해 주세요.'
      }
      return '동기화에 실패했습니다.'
  }
}
