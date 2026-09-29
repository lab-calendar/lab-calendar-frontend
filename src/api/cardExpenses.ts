import { apiClient } from './client'
import type { CardSync, CardSyncStatus } from '../types/domain'

/**
 * 카드 사용 내역 동기화 API (KAN-59 수동 트리거, KAN-60 이력 조회).
 *
 * 카드 일정 자체는 일반 일정 조회에 섞여 내려오므로(`/api/events`) 여기에 목록
 * 조회는 없다. 이 파일이 다루는 것은 "언제 어떻게 들어왔는가" 뿐이다.
 */

type ApiResponse<T> = { data: T }

/** docs/api-contract.md §9.1 — 서버가 마지막 실행 한 건을 요약해 내려준다. */
type CardSyncDto = {
  status: CardSyncStatus
  lastSyncedAt: string | null
  processedCount: number
  skippedCount: number
  message: string | null
}

function toCardSync(dto: CardSyncDto): CardSync {
  return {
    status: dto.status,
    lastSyncedAt: dto.lastSyncedAt ?? undefined,
    processedCount: dto.processedCount,
    skippedCount: dto.skippedCount,
    message: dto.message ?? undefined,
  }
}

/** 마지막 동기화 결과. 한 번도 돌지 않았으면 status 가 NEVER_RUN 이다. */
export async function fetchCardSync(): Promise<CardSync> {
  const { data } = await apiClient.get<ApiResponse<CardSyncDto>>(
    '/api/card-expenses/sync-logs',
  )
  return toCardSync(data.data)
}

/**
 * 지금 당장 동기화한다.
 *
 * 주기 동기화(기본 1시간)를 기다릴 수 없을 때 쓴다 — 장부를 고친 직후 달력에서
 * 확인하려는 경우다. 서버는 이미 돌고 있으면 409 로 거절하므로(계약 §9.2) 화면이
 * 두 번 눌리는 것까지 막을 필요는 없다.
 */
export async function syncCardExpenses(): Promise<CardSync> {
  const { data } = await apiClient.post<ApiResponse<CardSyncDto>>(
    '/api/card-expenses/sync',
  )
  return toCardSync(data.data)
}
