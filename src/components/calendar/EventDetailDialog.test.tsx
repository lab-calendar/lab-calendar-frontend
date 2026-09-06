import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCategories } from '../../api/categories'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { CalendarEvent, Category } from '../../types/domain'
import EventDetailDialog from './EventDetailDialog'

vi.mock('../../api/categories', () => ({
  fetchCategories: vi.fn(),
}))

const CATEGORIES: Category[] = [
  { id: 1, key: 'project', name: '과제/연구 관리' },
  { id: 2, key: 'lab', name: '랩실 주기적 일정' },
  { id: 3, key: 'card', name: '카드/경비 사용' },
]

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: '1',
    title: '정기 주간 랩미팅',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    categoryKey: 'lab',
    participants: [],
    source: 'MANUAL',
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(fetchCategories).mockResolvedValue(CATEGORIES)
})

describe('EventDetailDialog', () => {
  it('event 가 없으면 내용을 그리지 않는다', () => {
    renderWithRouter(<EventDetailDialog event={null} onClose={() => {}} />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('제목과 기간을 보여준다', async () => {
    renderWithRouter(
      <EventDetailDialog event={event()} onClose={() => {}} />,
    )

    expect(
      screen.getByRole('heading', { name: '정기 주간 랩미팅' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2026년 9월 10일 (목)')).toBeInTheDocument()
    expect(await screen.findByText('랩실 주기적 일정')).toBeInTheDocument()
  })

  it('기간형 일정은 시작일과 종료일을 함께 보여준다', () => {
    renderWithRouter(
      <EventDetailDialog
        event={event({ startDate: '2026-09-08', endDate: '2026-09-26' })}
        onClose={() => {}}
      />,
    )

    expect(
      screen.getByText('2026년 9월 8일 (화) ~ 9월 26일 (토)'),
    ).toBeInTheDocument()
  })

  it('참석 인원과 총 인원수를 보여준다', () => {
    renderWithRouter(
      <EventDetailDialog
        event={event({ participants: ['홍길동', '김철수', '이영희'] })}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText(/홍길동, 김철수, 이영희/)).toBeInTheDocument()
    expect(screen.getByText('· 총 3명')).toBeInTheDocument()
  })

  it('카테고리에 따라 부가 정보의 라벨이 달라진다', () => {
    const { unmount } = renderWithRouter(
      <EventDetailDialog
        event={event({ categoryKey: 'card', detail: '다과비' })}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('사용 목적')).toBeInTheDocument()
    unmount()

    renderWithRouter(
      <EventDetailDialog
        event={event({ categoryKey: 'project', detail: '연차보고서' })}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('제출 단계')).toBeInTheDocument()
  })

  it('구글 연동 일정임을 알려준다', () => {
    renderWithRouter(
      <EventDetailDialog
        event={event({ source: 'GOOGLE_SYNC' })}
        onClose={() => {}}
      />,
    )

    expect(
      screen.getByText('구글 공유 문서에서 동기화된 일정입니다.'),
    ).toBeInTheDocument()
  })

  // close 이벤트는 버블링하지 않아 React 의 onClose prop 으로는 잡히지 않는다.
  // 이걸 놓치면 ESC 로 닫았을 때 상태가 남아 같은 일정을 다시 열 수 없다.
  it('ESC 등으로 dialog 가 닫히면 onClose 가 호출된다', () => {
    const onClose = vi.fn()
    renderWithRouter(<EventDetailDialog event={event()} onClose={onClose} />)

    const dialog = document.querySelector('dialog')!
    dialog.close()

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ESC 를 누르면 onClose 가 호출된다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithRouter(<EventDetailDialog event={event()} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('닫혀 있을 때는 ESC 에 반응하지 않는다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithRouter(<EventDetailDialog event={null} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('닫기 버튼을 누르면 onClose 가 호출된다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithRouter(<EventDetailDialog event={event()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
