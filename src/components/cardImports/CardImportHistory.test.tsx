import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCardImports } from '../../api/cardImports'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { CardImportHistoryEntry } from '../../types/domain'
import { formatDateTime } from '../../utils/date'
import CardImportHistory from './CardImportHistory'

vi.mock('../../api/cardImports', () => ({ fetchCardImports: vi.fn() }))

/**
 * 이력 목록 (KAN-60).
 *
 * 서버가 내려주는 것은 sync_log 한 줄이라 달별 집계도 `totals` 묶음도 없다. 화면이
 * 그 평평한 모양을 그대로 읽는지, 끝나지 않은 회차와 실패한 회차를 숫자 대신 말로
 * 설명하는지를 본다 — 0 건이 성공처럼 보이는 것이 여기서 가장 위험하다.
 */
function entry(
  overrides: Partial<CardImportHistoryEntry> = {},
): CardImportHistoryEntry {
  return {
    id: '90',
    fileName: '회의록 인원.xlsx',
    status: 'SUCCESS',
    startedAt: '2026-09-29T09:09:58+09:00',
    finishedAt: '2026-09-29T09:10:00+09:00',
    durationMs: 2140,
    processed: 35,
    added: 3,
    updated: 0,
    removed: 0,
    skippedRows: 0,
    errorCode: null,
    problemCount: 0,
    problems: [],
    ...overrides,
  }
}

describe('CardImportHistory', () => {
  beforeEach(() => {
    vi.mocked(fetchCardImports).mockReset()
  })

  it('반영한 회차의 추가·사라짐 건수를 보여준다', async () => {
    vi.mocked(fetchCardImports).mockResolvedValue([
      entry({ added: 2, removed: 1, skippedRows: 1, problemCount: 1, status: 'PARTIAL' }),
    ])

    renderWithRouter(<CardImportHistory />)

    expect(
      await screen.findByText(/추가 2 · 사라짐 1 · 건너뜀 1행 · 문제 1건/),
    ).toBeInTheDocument()
    expect(screen.getByText('일부 반영')).toBeInTheDocument()
  })

  it('실패한 회차는 건수 대신 사유 코드를 보여준다', async () => {
    vi.mocked(fetchCardImports).mockResolvedValue([
      entry({ status: 'FAILED', added: 0, errorCode: 'NO_APPLICABLE_MONTHS' }),
    ])

    renderWithRouter(<CardImportHistory />)

    // 추가 0 건이라고 적으면 아무 일도 없었던 성공처럼 읽힌다
    expect(
      await screen.findByText(/반영하지 못했습니다 \(NO_APPLICABLE_MONTHS\)/),
    ).toBeInTheDocument()
  })

  it('끝나지 않은 회차는 시작 시각으로 표시한다', async () => {
    vi.mocked(fetchCardImports).mockResolvedValue([
      entry({ status: 'RUNNING', finishedAt: null, durationMs: null, added: 0 }),
    ])

    renderWithRouter(<CardImportHistory />)

    expect(await screen.findByText('올리는 중')).toBeInTheDocument()
    // 끝난 시각이 없으니 시작 시각이 그 자리를 채운다 (표시 서식은 기기 시간대를 따른다)
    expect(
      screen.getByText(formatDateTime('2026-09-29T09:09:58+09:00')),
    ).toBeInTheDocument()
  })
})
