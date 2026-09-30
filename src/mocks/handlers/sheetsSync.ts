import { http } from 'msw'
import { mockDb, nextId } from '../data/db'
import type { MockCardImport } from '../data/types'
import { sheetsSyncCase } from '../scenario'
import { failIfScenario, guard, ok } from './respond'

/**
 * 시트에서 지금 가져오기 (KAN-88).
 *
 * 목은 구글에 가지 않는다 — 그 구간은 서버가 다루고, 여기서 흉내 내면 화면이 아니라
 * 가짜 구글을 시험하게 된다. 대신 **화면이 갈라져야 하는 응답**을 그대로 만든다:
 * 반영된 경우, 안전장치가 달을 건너뛴 경우, 권한이 끊긴 경우, 연동이 꺼진 경우.
 *
 * `mockApi.sheetsSync('braked')` 또는 `?mockSheetsSync=braked` 로 고른다.
 */
export const sheetsSyncHandlers = [
  http.post('/api/card-expenses/sheets-sync', async ({ request }) => {
    const failure = await failIfScenario('cardImports')
    if (failure) return failure

    const denied = await guard(request.method)
    if (denied) return denied

    const chosen = sheetsSyncCase()

    if (chosen === 'disabled') {
      /*
       * 서버가 꺼져 있을 때 주는 503 은 공통 에러 코드에 없다 — 가져오기 전용이라
       * 여기서 직접 만든다. 화면은 이 코드를 보고 "고장"이 아니라 "설정"으로 다룬다.
       */
      return new Response(
        JSON.stringify({
          code: 'SHEETS_SYNC_DISABLED',
          message: '시트 동기화가 켜져 있지 않습니다.',
          fieldErrors: {},
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (chosen === 'denied') {
      return ok({
        applied: false,
        failure: 'SHEETS_PERMISSION_DENIED',
        added: 0,
        removed: 0,
        unchanged: 0,
        braked: [],
      })
    }

    const braked =
      chosen === 'braked'
        ? [{ month: '2026-08', wouldRemove: 31, active: 34 }]
        : []
    const result = {
      applied: true,
      failure: null,
      added: chosen === 'braked' ? 2 : 5,
      removed: chosen === 'braked' ? 0 : 1,
      unchanged: 12,
      braked,
    }

    // 자동 회차도 이력에 남는다 (KAN-89) — 화면이 그 줄을 함께 보여준다
    const finishedAt = new Date().toISOString()
    const entry: MockCardImport = {
      id: nextId(),
      fileName: '구글 시트 자동 동기화',
      status: braked.length > 0 ? 'PARTIAL' : 'SUCCESS',
      startedAt: finishedAt,
      finishedAt,
      durationMs: 900,
      processed: result.added + result.unchanged,
      added: result.added,
      updated: 0,
      removed: result.removed,
      skippedRows: 0,
      errorCode: null,
      problemCount: 0,
      problems: [],
    }
    mockDb().cardImports.unshift(entry)

    return ok(result)
  }),
]
