import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCategories } from '../../api/categories'
import { createEvent, updateEvent } from '../../api/events'
import {
  EventFormContext,
  type EventFormContextValue,
} from '../../contexts/EventFormContext'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { CalendarEvent, Category } from '../../types/domain'
import EventForm from './EventForm'

vi.mock('../../api/categories', () => ({ fetchCategories: vi.fn() }))
vi.mock('../../api/events', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}))

const CATEGORIES: Category[] = [
  { id: 1, key: 'project', name: '과제/연구 관리' },
  { id: 2, key: 'lab', name: '랩실 주기적 일정' },
  { id: 3, key: 'card', name: '카드/경비 사용' },
]

const EXISTING: CalendarEvent = {
  id: '42',
  title: '정기 주간 랩미팅',
  detail: '홍길동',
  startDate: '2026-09-10',
  endDate: '2026-09-10',
  categoryKey: 'lab',
  participants: ['홍길동', '김철수'],
  memo: '주간 진행 공유',
  source: 'MANUAL',
}

function renderForm(editingEvent: CalendarEvent | null = null) {
  const startCreate = vi.fn()
  const value: EventFormContextValue = {
    editingEvent,
    startEdit: vi.fn(),
    startCreate,
  }

  renderWithRouter(
    <EventFormContext value={value}>
      <EventForm />
    </EventFormContext>,
  )

  return { startCreate }
}

beforeEach(() => {
  vi.mocked(fetchCategories).mockResolvedValue(CATEGORIES)
  vi.mocked(createEvent).mockResolvedValue({ ...EXISTING, id: 'new' })
  vi.mocked(updateEvent).mockResolvedValue(EXISTING)
})

describe('EventForm 등록 모드', () => {
  it('제목이 비면 저장하지 않고 오류를 보여준다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('제목을 입력해 주세요.')).toBeInTheDocument()
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('종료일이 시작일보다 빠르면 저장하지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('제목'), '연구실 청소')
    await user.clear(screen.getByLabelText('시작일'))
    await user.type(screen.getByLabelText('시작일'), '2026-09-10')
    await user.clear(screen.getByLabelText('종료일'))
    await user.type(screen.getByLabelText('종료일'), '2026-09-09')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(
      await screen.findByText('종료일은 시작일보다 빠를 수 없습니다.'),
    ).toBeInTheDocument()
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('올바르게 입력하면 참석자를 나눠 저장한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('제목'), '연구실 청소')
    await user.type(screen.getByLabelText('참석 인원'), '홍길동, 김철수')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(createEvent).toHaveBeenCalledOnce())
    expect(vi.mocked(createEvent).mock.calls[0][0]).toMatchObject({
      title: '연구실 청소',
      participants: ['홍길동', '김철수'],
    })
  })

  it('항목 유형에 따라 부가 정보 라벨이 바뀐다', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByLabelText('제출 단계')).toBeInTheDocument()

    // 카테고리 목록은 비동기로 채워진다
    await screen.findByRole('option', { name: '카드/경비 사용' })
    await user.selectOptions(screen.getByLabelText('항목 유형'), 'card')

    expect(screen.getByLabelText('사용 목적')).toBeInTheDocument()
  })
})

describe('EventForm 수정 모드', () => {
  it('기존 일정으로 폼이 채워진다', () => {
    renderForm(EXISTING)

    expect(screen.getByLabelText('제목')).toHaveValue('정기 주간 랩미팅')
    expect(screen.getByLabelText('담당 연구원')).toHaveValue('홍길동')
    expect(screen.getByLabelText('참석 인원')).toHaveValue('홍길동, 김철수')
    expect(screen.getByLabelText('메모')).toHaveValue('주간 진행 공유')
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
  })

  it('저장하면 해당 일정을 수정한다', async () => {
    const user = userEvent.setup()
    const { startCreate } = renderForm(EXISTING)

    await user.click(screen.getByRole('button', { name: '수정' }))

    await waitFor(() => expect(updateEvent).toHaveBeenCalledOnce())
    expect(vi.mocked(updateEvent).mock.calls[0][0]).toBe('42')
    // 저장 후에는 등록 모드로 돌아간다
    await waitFor(() => expect(startCreate).toHaveBeenCalled())
  })
})
