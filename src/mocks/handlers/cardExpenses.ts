import { http } from 'msw'
import { currentTier, mockDb } from '../data/db'
import { fail, failIfScenario, guard, ok } from './respond'

/**
 * 카드 내역 동기화 (KAN-59 수동 트리거, KAN-60 이력 조회).
 *
 * 카드 일정 목록은 여기 없다 — 일반 일정 조회에 섞여 내려온다. 이 파일은 "언제
 * 어떻게 들어왔는가" 만 다룬다.
 */

/** 동기화가 한 번 돌 때 들어오는 건수. 목에서는 장부를 읽는 척만 한다. */
const PROCESSED_PER_RUN = 3

export const cardExpenseHandlers = [
  http.get('/api/card-expenses/sync-logs', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    /*
     * 조회 등급은 카드 지출을 아예 받지 못한다(KAN-35). 동기화 이력도 같은 데이터라
     * 403 이다 — 지출 내역을 가리면서 "3건 반영됨" 을 알려 주면 가린 의미가 없다.
     */
    if (currentTier() === 'VIEWER') return fail('FORBIDDEN')

    const failure = await failIfScenario('cardExpenses')
    if (failure) return failure

    return ok(mockDb().cardSync)
  }),

  http.post('/api/card-expenses/sync', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    /*
     * `mockApi.fail('cardExpenses')` 로 꺼 두면 실패 배너를 눌러 볼 수 있다. 서버가
     * 실패를 이력에 적어 두므로(KAN-60) 목도 상태를 FAILED 로 남긴다 — 그러지 않으면
     * 새로고침에 배너가 사라져 실제 서버와 다르게 보인다.
     */
    const failure = await failIfScenario('cardExpenses')
    if (failure) {
      mockDb().cardSync = {
        status: 'FAILED',
        lastSyncedAt: mockDb().cardSync.lastSyncedAt,
        processedCount: 0,
        skippedCount: 0,
        message: '원본 문서를 읽을 수 없습니다. 공유 권한을 확인해 주세요.',
      }
      return failure
    }

    const synced = {
      status: 'SUCCESS' as const,
      lastSyncedAt: new Date().toISOString(),
      processedCount: PROCESSED_PER_RUN,
      // 양식이 깨진 행은 매번 그대로 남는다 — 장부를 고치기 전에는 계속 건너뛴다
      skippedCount: mockDb().cardSync.skippedCount,
      message: null,
    }

    mockDb().cardSync = synced
    return ok(synced)
  }),
]
