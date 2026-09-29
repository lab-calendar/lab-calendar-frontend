import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { fetchCardSync, syncCardExpenses } from '../../api/cardExpenses'
import { ApiError } from '../../api/errors'
import { renderWithRouter, VIEWER_SESSION } from '../../test/renderWithRouter'
import type { CardSync } from '../../types/domain'
import CardSyncStatus from './CardSyncStatus'

vi.mock('../../api/cardExpenses', () => ({
  fetchCardSync: vi.fn(),
  syncCardExpenses: vi.fn(),
}))

function sync(overrides: Partial<CardSync> = {}): CardSync {
  return {
    status: 'SUCCESS',
    lastSyncedAt: '2026-09-28T14:00:00+09:00',
    processedCount: 3,
    skippedCount: 0,
    ...overrides,
  }
}

function given(state: CardSync) {
  vi.mocked(fetchCardSync).mockResolvedValue(state)
}

describe('CardSyncStatus (KAN-61)', () => {
  it('마지막으로 카드 내역이 들어온 시각을 보여준다', async () => {
    given(sync())
    renderWithRouter(<CardSyncStatus />)

    // 날짜 문구는 보는 사람의 시간대로 읽히므로 시각까지 고정해 비교하지 않는다
    expect(await screen.findByText(/카드 내역 최신 기준/)).toBeInTheDocument()
  })

  it('건너뛴 행이 있으면 함께 알린다', async () => {
    // 조용히 빠지면 장부가 틀린 줄도 모른 채 정산하게 된다
    given(sync({ skippedCount: 2 }))
    renderWithRouter(<CardSyncStatus />)

    expect(await screen.findByText(/건너뛴 행 2건/)).toBeInTheDocument()
  })

  it('한 번도 돌지 않았으면 그 사실을 말한다', async () => {
    given(sync({ status: 'NEVER_RUN', lastSyncedAt: undefined }))
    renderWithRouter(<CardSyncStatus />)

    expect(
      await screen.findByText('카드 내역을 아직 가져오지 않았습니다.'),
    ).toBeInTheDocument()
  })

  describe('동기화가 실패한 상태', () => {
    it('서버가 준 사유를 그대로 경고로 띄운다', async () => {
      given(
        sync({
          status: 'FAILED',
          message: '원본 문서를 읽을 수 없습니다. 공유 권한을 확인해 주세요.',
        }),
      )
      renderWithRouter(<CardSyncStatus />)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('카드 내역을 가져오지 못했습니다.')
      expect(alert).toHaveTextContent('공유 권한을 확인해 주세요.')
    })

    it('사유가 없으면 무엇을 확인해야 하는지 알려준다', async () => {
      // 원인은 서버만 안다. 프론트가 추측해 적으면 엉뚱한 곳을 뒤지게 된다
      given(sync({ status: 'FAILED', message: undefined }))
      renderWithRouter(<CardSyncStatus />)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        '원본 문서의 양식과 공유 권한을 확인한 뒤 다시 시도해 주세요.',
      )
    })
  })

  describe('수동 동기화', () => {
    it('누르면 서버에 요청하고 결과 건수를 알린다', async () => {
      given(sync({ lastSyncedAt: '2026-09-28T09:00:00+09:00' }))
      vi.mocked(syncCardExpenses).mockResolvedValue(
        sync({ processedCount: 5, lastSyncedAt: '2026-09-28T15:00:00+09:00' }),
      )
      renderWithRouter(<CardSyncStatus />)

      await userEvent.click(await screen.findByRole('button', { name: '지금 동기화' }))

      await waitFor(() => {
        expect(syncCardExpenses).toHaveBeenCalledTimes(1)
      })
      expect(
        await screen.findByText('카드 내역 5건을 반영했습니다.'),
      ).toBeInTheDocument()
    })

    it('건너뛴 행이 있으면 알림에도 적는다', async () => {
      given(sync())
      vi.mocked(syncCardExpenses).mockResolvedValue(
        sync({ processedCount: 4, skippedCount: 1 }),
      )
      renderWithRouter(<CardSyncStatus />)

      await userEvent.click(await screen.findByRole('button', { name: '지금 동기화' }))

      expect(
        await screen.findByText(/1건은 양식이 맞지 않아 건너뛰었습니다/),
      ).toBeInTheDocument()
    })

    it('실패하면 사유를 알리고 버튼을 다시 쓸 수 있게 둔다', async () => {
      given(sync())
      vi.mocked(syncCardExpenses).mockRejectedValue(
        new ApiError('CONFLICT', '이미 동기화가 진행 중입니다.'),
      )
      renderWithRouter(<CardSyncStatus />)

      const button = await screen.findByRole('button', { name: '지금 동기화' })
      await userEvent.click(button)

      expect(
        await screen.findByText(/이미 동기화가 진행 중입니다/),
      ).toBeInTheDocument()
      // 한 번 실패한 뒤 다시 시도할 수 없으면 사람이 할 수 있는 일이 없어진다
      expect(await screen.findByRole('button', { name: '지금 동기화' })).toBeEnabled()
    })
  })

  it('조회 등급에게는 아무것도 보이지 않는다', async () => {
    // 카드 지출은 조회 등급에 아예 내려오지 않는다 (KAN-35)
    given(sync())
    renderWithRouter(<CardSyncStatus />, { session: VIEWER_SESSION })

    expect(screen.queryByRole('button', { name: '지금 동기화' })).not.toBeInTheDocument()
    // 쓸 데도 없는 403 을 받아 오지 않는다
    expect(fetchCardSync).not.toHaveBeenCalled()
  })

  it('상태를 못 받아 오면 줄 자체가 빠진다', async () => {
    // 달력 본체가 이미 조회 실패를 알린다. 같은 실패를 두 번 말할 필요가 없다
    vi.mocked(fetchCardSync).mockRejectedValue(new ApiError('SERVER', '서버 오류'))
    renderWithRouter(<CardSyncStatus />)

    await waitFor(() => {
      expect(fetchCardSync).toHaveBeenCalled()
    })
    expect(screen.queryByRole('button', { name: '지금 동기화' })).not.toBeInTheDocument()
  })
})
