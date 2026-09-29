import type { CategoryKey } from '../../constants/categories'
import type { EventSource } from '../../types/domain'

/** 목 서버가 들고 있는 일정. 서버 테이블에 가깝게 두고, 응답 모양은 핸들러가 만든다. */
export type MockEvent = {
  id: string
  title: string
  detail: string | null
  startDate: string
  endDate: string
  categoryKey: CategoryKey
  memo: string | null
  participants: string[]
  /*
   * 도메인 타입을 그대로 쓴다. 여기서 따로 적어 두면 서버 계약에 없는 값(CARD_IMPORT)
   * 이 목에만 조용히 생겨나고, 화면이 모르는 출처를 받아도 테스트가 잡지 못한다.
   */
  source: EventSource
}

export type MockProject = {
  id: string
  name: string
  submissionStage: string | null
  endDate: string
  leadTimeDays: number
  active: boolean
}

export type MockMember = {
  id: string
  name: string
  active: boolean
}

export type MockTier = 'EDITOR' | 'VIEWER'

/** 카드 내역 업로드 한 회차. 서버의 sync_log 한 줄에 해당한다 (KAN-60). */
export type MockCardImport = {
  id: string
  importedAt: string
  fileName: string
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'
  totals: {
    added: number
    removed: number
    unchanged: number
    skippedRows: number
    blockedMonths: number
  }
}
