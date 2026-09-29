import { http } from 'msw'
import { currentTier, mockDb, nextId } from '../data/db'
import type { MockCardImport } from '../data/types'
import { cardImportCase } from '../scenario'
import { fail, failIfScenario, guard, ok } from './respond'

/**
 * 카드 내역 엑셀 가져오기 (KAN-54 설계 §6.2).
 *
 * 목은 엑셀을 실제로 파싱하지 않는다. 그 일은 서버(POI)가 하고, 여기서 흉내 내면
 * 화면이 아니라 가짜 파서를 시험하게 된다. 대신 **화면이 다뤄야 하는 응답 모양**을
 * 그대로 만들어 준다 — 반영할 달과 막힌 달, 사라지는 행, 문제 행, 건너뛴 시트.
 *
 * 어떤 결과를 줄지는 `mockApi.cardImport('blocked')` 또는 `?mockCardImport=blocked`
 * 로 고른다. 파일 이름으로 고르지 않는 이유는, 파일을 실어 보내는 경로에 따라
 * 이름이 `blob` 으로 바뀌어 도착하기 때문이다 — 그 위에 규칙을 세우면 목이 환경마다
 * 다르게 움직인다.
 */

/**
 * 미리보기와 반영 사이에 서버가 확인하는 값.
 *
 * 실제 서버는 파일 해시·대상 월·DB 지문·파서 버전·만료를 묶어 서명한다. 목은 마지막
 * 미리보기인지만 본다 — 화면이 갈라져야 하는 지점이 거기 하나다. 파일 속성으로 묶지
 * 않는 이유는, 파일을 실어 보내는 경로에 따라 이름과 크기가 달라져 도착하기 때문이다.
 */
function issuePreviewToken(): string {
  return `preview:${nextId()}`
}

function previewFor() {
  const chosen = cardImportCase()

  if (chosen === 'empty') {
    return {
      months: [],
      skippedSheets: [
        { sheet: '복사용 시트', reason: 'NOT_MONTH_SHEET' },
        { sheet: '7월', reason: 'YEAR_MISSING' },
      ],
      problems: [],
      totals: {
        added: 0,
        removed: 0,
        unchanged: 0,
        skippedRows: 0,
        blockedMonths: 0,
      },
    }
  }

  if (chosen === 'blocked') {
    return {
      months: [
        { month: '2026-09', status: 'BLOCKED' as const, added: 0, removed: 0, unchanged: 0 },
        { month: '2026-08', status: 'READY' as const, added: 2, removed: 1, unchanged: 18 },
      ],
      skippedSheets: [{ sheet: '7월', reason: 'YEAR_MISSING' }],
      problems: [
        {
          sheet: '2026년 9월',
          row: 14,
          level: 'ERROR' as const,
          code: 'CARD_MISSING',
          message: '과제명이 비어 있어 해당 월 전체를 유지합니다.',
        },
        {
          sheet: '2026년 8월',
          row: 31,
          level: 'WARNING' as const,
          code: 'PARTICIPANTS_REWRITTEN',
          message: '참석자 원문을 그대로 나누지 못해 메모에 남겼습니다.',
        },
      ],
      totals: {
        added: 2,
        removed: 1,
        unchanged: 18,
        skippedRows: 1,
        blockedMonths: 1,
      },
    }
  }

  return {
    months: [
      { month: '2026-09', status: 'READY' as const, added: 3, removed: 0, unchanged: 12 },
      { month: '2026-08', status: 'READY' as const, added: 0, removed: 0, unchanged: 20 },
    ],
    skippedSheets: [{ sheet: '복사용 시트', reason: 'NOT_MONTH_SHEET' }],
    problems: [],
    totals: {
      added: 3,
      removed: 0,
      unchanged: 32,
      skippedRows: 0,
      blockedMonths: 0,
    },
  }
}

/** 카드 데이터라 조회 등급은 미리보기·반영·이력 모두 403 이다 (설계 §6.2). */
function denyViewer(): Promise<Response> | null {
  return currentTier() === 'VIEWER' ? fail('FORBIDDEN') : null
}

export const cardImportHandlers = [
  http.get('/api/card-expenses/imports', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const viewerDenied = denyViewer()
    if (viewerDenied) return viewerDenied

    const failure = await failIfScenario('cardImports')
    if (failure) return failure

    return ok(mockDb().cardImports)
  }),

  http.post('/api/card-expenses/imports', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const viewerDenied = denyViewer()
    if (viewerDenied) return viewerDenied

    const failure = await failIfScenario('cardImports')
    if (failure) return failure

    const form = await request.formData()
    /*
     * `instanceof File` 로 보지 않는다. 브라우저와 테스트(jsdom·undici)가 서로 다른
     * File 을 쓰기 때문에, 실제로 파일이 실려 왔는데도 아니라고 판정된다. 이름이
     * 있는지로 충분하다 — 서버는 내용을 파싱해 다시 검증한다.
     */
    const uploaded = form.get('file')
    if (uploaded === null || typeof uploaded === 'string') {
      return fail('VALIDATION_FAILED', { file: '파일을 선택해 주세요.' })
    }

    const fileName = 'name' in uploaded ? String(uploaded.name) : 'blob'

    const dryRun = new URL(request.url).searchParams.get('dryRun') !== 'false'
    const preview = previewFor()

    if (dryRun) {
      // 미리보기는 업무 데이터를 건드리지 않는다. 이력도 남기지 않는다
      const previewToken = issuePreviewToken()
      mockDb().lastPreviewToken = previewToken
      return ok({ dryRun: true, previewToken, fileName, ...preview })
    }

    const submittedToken = form.get('previewToken')
    if (typeof submittedToken !== 'string' || submittedToken === '') {
      return fail('VALIDATION_FAILED', {
        previewToken: '미리보기를 먼저 받아 주세요.',
      })
    }

    // 그새 다른 미리보기를 받았거나 이미 반영한 토큰이면 낡은 것이다
    if (submittedToken !== mockDb().lastPreviewToken) {
      return fail('PREVIEW_STALE')
    }

    if (!preview.months.some((month) => month.status === 'READY')) {
      return fail('NO_APPLICABLE_MONTHS')
    }

    /*
     * 이력은 업로드 응답과 모양이 다르다 — 서버가 sync_log 한 줄을 그대로 내려주므로
     * 달별 집계가 없고 회차 합만 평평하게 남는다 (KAN-60).
     */
    const finishedAt = new Date().toISOString()
    const entry: MockCardImport = {
      id: nextId(),
      fileName,
      status: preview.totals.blockedMonths > 0 ? 'PARTIAL' : 'SUCCESS',
      startedAt: finishedAt,
      finishedAt,
      durationMs: 1200,
      processed:
        preview.totals.added + preview.totals.removed + preview.totals.unchanged,
      added: preview.totals.added,
      updated: 0,
      removed: preview.totals.removed,
      skippedRows: preview.totals.skippedRows,
      errorCode: null,
      problemCount: preview.problems.length,
      problems: preview.problems,
    }
    mockDb().cardImports.unshift(entry)
    // 한 번 반영한 미리보기는 다시 쓸 수 없다
    mockDb().lastPreviewToken = null

    return ok({ dryRun: false, previewToken: submittedToken, fileName, ...preview })
  }),
]
