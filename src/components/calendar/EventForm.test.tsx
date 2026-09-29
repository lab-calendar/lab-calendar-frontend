import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCategories } from '../../api/categories'
import { createEvent, updateEvent } from '../../api/events'
import { fetchMembers } from '../../api/members'
import {
  EventFormContext,
  type EventFormContextValue,
} from '../../contexts/EventFormContext'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { CalendarEvent, Category, Member } from '../../types/domain'
import EventForm from './EventForm'

vi.mock('../../api/categories', () => ({ fetchCategories: vi.fn() }))
vi.mock('../../api/events', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}))
vi.mock('../../api/members', async (importOriginal) => ({
  // activeMembers 는 순수 함수라 실제 구현을 그대로 쓴다
  ...(await importOriginal<typeof import('../../api/members')>()),
  fetchMembers: vi.fn(),
}))

const CATEGORIES: Category[] = [
  { id: '1', key: 'project', name: '과제/연구 관리' },
  { id: '2', key: 'lab', name: '랩실 주기적 일정' },
  { id: '3', key: 'card', name: '카드/경비 사용' },
]

const MEMBERS: Member[] = [
  { id: 'm1', name: '홍길동', active: true },
  { id: 'm2', name: '김철수', active: true },
  { id: 'm3', name: '이영희', active: false },
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
  vi.mocked(fetchMembers).mockResolvedValue(MEMBERS)
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
    await user.click(await screen.findByRole('radio', { name: '카드/경비 사용' }))

    expect(screen.getByLabelText('구분')).toBeInTheDocument()
  })

  it('항목 유형은 이름 붙은 한 묶음의 라디오다', async () => {
    renderForm()

    // 칩 모양이어도 스크린 리더에는 "항목 유형" 그룹의 선택지 셋으로 읽혀야 한다
    const group = await screen.findByRole('group', { name: '항목 유형' })
    const options = await within(group).findAllByRole('radio')
    expect(options).toHaveLength(3)
  })

  it('새 일정은 과제/연구 관리가 골라진 채로 시작한다', async () => {
    renderForm()

    expect(
      await screen.findByRole('radio', { name: '과제/연구 관리' }),
    ).toBeChecked()
  })

  it('방향키로 유형을 옮겨 고를 수 있다', async () => {
    const user = userEvent.setup()
    renderForm()

    const first = await screen.findByRole('radio', { name: '과제/연구 관리' })
    first.focus()
    await user.keyboard('{ArrowDown}')

    // 기본 라디오 동작 그대로 — 직접 만든 드롭다운이었으면 따로 구현해야 했을 부분
    expect(screen.getByRole('radio', { name: '랩실 주기적 일정' })).toBeChecked()
    expect(screen.getByLabelText('담당 연구원')).toBeInTheDocument()
  })
})

describe('EventForm 명단에서 고르기 (KAN-74)', () => {
  /** 명단 칩을 이름으로 찾는다. 같은 이름이 입력칸에도 있어 그룹 안에서 찾는다. */
  async function chipOf(name: string) {
    const group = await screen.findByRole('group', { name: '명단에서 고르기' })
    return within(group).getByRole('button', { name: new RegExp(name) })
  }

  it('재직 중인 구성원만 후보로 올린다', async () => {
    renderForm()

    const group = await screen.findByRole('group', { name: '명단에서 고르기' })

    expect(within(group).getAllByRole('button')).toHaveLength(2)
    expect(within(group).queryByRole('button', { name: /이영희/ })).toBeNull()
  })

  it('담당 연구원 칸에는 명단을 이름 제안으로 붙인다', async () => {
    renderForm(EXISTING)

    // 랩실 일정의 부가 정보는 사람 이름이다. 제출 단계·카드 구분에는 붙이지 않는다.
    const input = screen.getByLabelText('담당 연구원')
    await waitFor(() => expect(input).toHaveAttribute('list'))

    const options = Array.from(
      document
        .getElementById(input.getAttribute('list') ?? '')
        ?.querySelectorAll('option') ?? [],
    ).map((option) => option.value)
    expect(options).toEqual(['홍길동', '김철수'])
  })

  it('누르면 참석 인원에 들어가고 다시 누르면 빠진다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(await chipOf('홍길동'))
    expect(screen.getByLabelText('참석 인원')).toHaveValue('홍길동')

    await user.click(await chipOf('김철수'))
    expect(screen.getByLabelText('참석 인원')).toHaveValue('홍길동, 김철수')

    await user.click(await chipOf('홍길동'))
    expect(screen.getByLabelText('참석 인원')).toHaveValue('김철수')
  })

  it('이미 들어가 있는 사람은 눌린 상태로 보인다', async () => {
    renderForm(EXISTING)

    expect(await chipOf('홍길동')).toHaveAttribute('aria-pressed', 'true')
    expect(await chipOf('김철수')).toHaveAttribute('aria-pressed', 'true')
  })

  it('손으로 친 이름도 그대로 저장된다', async () => {
    // 명단에 없는 외부 인원 때문에 일정을 못 만들면 안 된다
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('제목'), '외부 세미나')
    await user.type(screen.getByLabelText('참석 인원'), '외부 연구원')
    await user.click(await chipOf('홍길동'))
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(createEvent).toHaveBeenCalledOnce())
    expect(vi.mocked(createEvent).mock.calls[0][0]).toMatchObject({
      participants: ['외부 연구원', '홍길동'],
    })
  })

  it('명단을 못 받아 오면 자유 입력만 남는다', async () => {
    vi.mocked(fetchMembers).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('제목'), '연구실 청소')
    await user.type(screen.getByLabelText('참석 인원'), '홍길동')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(createEvent).toHaveBeenCalledOnce())
    expect(
      screen.queryByRole('group', { name: '명단에서 고르기' }),
    ).toBeNull()
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
