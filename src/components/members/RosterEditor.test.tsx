import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  EventFormContext,
  type EventFormContextValue,
} from '../../contexts/EventFormContext'
import { renderWithRouter } from '../../test/renderWithRouter'
import { setUpMockApi } from '../../test/mockApi'
import EventForm from '../calendar/EventForm'

/*
 * 일정 등록 폼째로 띄운다 (KAN-85).
 *
 * 이 컴포넌트의 위험은 혼자 있을 때가 아니라 남의 폼 안에 있을 때 나온다 — 버튼이
 * 바깥 폼을 제출하거나, 이름 칸에서 Enter 를 눌렀을 때 일정이 저장되는 일. 떼어
 * 놓고 검증하면 정작 그 부분을 지나간다.
 */
const formContext: EventFormContextValue = {
  editingEvent: null,
  startEdit: vi.fn(),
  startCreate: vi.fn(),
}

function renderForm() {
  return renderWithRouter(
    <EventFormContext value={formContext}>
      <EventForm />
    </EventFormContext>,
  )
}

/** 명단을 받아 칩이 그려질 때까지 기다린 뒤 손잡이를 연다. */
async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('button', { name: /홍길동/ })
  await user.click(screen.getByRole('button', { name: '명단 고치기' }))
}

function panel() {
  return screen.getByRole('list', { hidden: false })
}

describe('RosterEditor', () => {
  setUpMockApi({ tier: 'EDITOR' })

  it('기본은 접혀 있다', async () => {
    renderForm()
    await screen.findByRole('button', { name: /홍길동/ })

    expect(
      screen.getByRole('button', { name: '명단 고치기' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: '추가' })).not.toBeInTheDocument()
  })

  it('열면 떠난 사람까지 명단 전체를 보여준다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    // 고르는 자리에는 재직 중인 사람만 올라온다 — 여기에는 떠난 사람도 있다
    const left = within(panel()).getByText('최지우').closest('li')!
    expect(left).toBeInTheDocument()
    // 표시가 색뿐이면 안 된다 — 글자로도 적혀 있다
    expect(within(left).getByText('재직 종료')).toBeInTheDocument()
    // 떠난 사람의 버튼은 되돌리는 쪽이다
    expect(within(left).getByRole('button', { name: '다시 재직' })).toBeInTheDocument()
  })

  it('추가한 사람을 곧바로 참석자로 고를 수 있다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    await user.type(screen.getByLabelText('추가할 이름'), '정재홍')
    await user.click(screen.getByRole('button', { name: '추가' }))

    // 폼을 떠나지 않고 고르는 자리에 올라온다
    const chip = await screen.findByRole('button', { name: /정재홍/ })
    await user.click(chip)
    expect(screen.getByLabelText('참석 인원')).toHaveValue('정재홍')
  })

  it('이름 칸에서 Enter 를 눌러도 일정이 저장되지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    await user.type(screen.getByLabelText('추가할 이름'), '정재홍{Enter}')

    // 이름은 들어가고
    expect(await screen.findByRole('button', { name: /정재홍/ })).toBeInTheDocument()
    // 제목이 비어 있으니 일정이 저장됐다면 그 오류가 떴을 것이다
    expect(screen.queryByText('제목을 입력해 주세요.')).not.toBeInTheDocument()
    expect(screen.queryByText(/일정을 등록했습니다/)).not.toBeInTheDocument()
  })

  it('빈 이름은 추가하지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('이름을 입력해 주세요.')).toBeInTheDocument()
  })

  it('이름을 고치면 고르는 자리의 이름도 바뀐다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    const row = within(panel()).getByText('김철수').closest('li')!
    await user.click(within(row).getByRole('button', { name: '이름 수정' }))

    const input = screen.getByLabelText('김철수 의 새 이름')
    await user.clear(input)
    await user.type(input, '김철중')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByRole('button', { name: /김철중/ })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /김철수/ })).not.toBeInTheDocument(),
    )
  })

  it('재직을 끄면 고르는 자리에서만 빠진다', async () => {
    const user = userEvent.setup()
    renderForm()
    await openPanel(user)

    const row = within(panel()).getByText('박민수').closest('li')!
    await user.click(within(row).getByRole('button', { name: '재직 종료' }))

    // 칩에서는 사라지고
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^\+?박민수/ })).not.toBeInTheDocument(),
    )
    // 명단에는 남는다 — 지난 일정의 기록이 사라지면 안 된다
    expect(within(panel()).getByText('박민수')).toBeInTheDocument()
  })
})
