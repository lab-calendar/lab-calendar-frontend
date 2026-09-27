import type { CategoryKey } from '../../constants/categories'

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
  source: 'MANUAL' | 'AUTO_GENERATED' | 'CARD_IMPORT'
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
