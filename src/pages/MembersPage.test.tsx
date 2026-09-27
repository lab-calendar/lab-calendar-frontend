import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import {
  createMember,
  deleteMember,
  fetchMembers,
  updateMember,
} from '../api/members'
import { renderWithRouter, VIEWER_SESSION } from '../test/renderWithRouter'
import type { Member } from '../types/domain'
import MembersPage from './MembersPage'

vi.mock('../api/members', async (importOriginal) => ({
  // activeMembers 는 순수 함수라 실제 구현을 그대로 쓴다
  ...(await importOriginal<typeof import('../api/members')>()),
  fetchMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
}))

const WORKING: Member = { id: 'm1', name: '홍길동', active: true }
const LEFT: Member = { id: 'm2', name: '김철수', active: false }

beforeEach(() => {
  vi.mocked(fetchMembers).mockResolvedValue([WORKING, LEFT])
  vi.mocked(createMember).mockResolvedValue({ ...WORKING, id: 'new' })
  vi.mocked(updateMember).mockResolvedValue(WORKING)
  vi.mocked(deleteMember).mockResolvedValue(undefined)
})

/** 구성원 줄을 이름으로 찾는다. */
async function rowOf(name: string) {
  const label = await screen.findByText(name)
  return label.closest('li') as HTMLElement
}

describe('MembersPage', () => {
  it('명단을 서버가 준 순서대로 보여주고 퇴사자를 표시한다', async () => {
    renderWithRouter(<MembersPage />)

    const names = (await screen.findAllByRole('listitem')).map(
      (item) => item.textContent,
    )
    expect(names[0]).toContain('홍길동')
    expect(names[1]).toContain('김철수')

    expect(within(await rowOf('김철수')).getByText('퇴사')).toBeInTheDocument()
    expect(within(await rowOf('홍길동')).queryByText('퇴사')).toBeNull()
  })

  it('구성원을 등록한다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    await user.type(await screen.findByLabelText('이름'), '이영희')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => {
      expect(createMember).toHaveBeenCalledWith({ name: '이영희', active: true })
    })
  })

  it('이름이 비면 저장하지 않는다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    await user.click(await screen.findByRole('button', { name: '등록' }))

    expect(await screen.findByText('이름을 입력해 주세요.')).toBeInTheDocument()
    expect(createMember).not.toHaveBeenCalled()
  })

  it('수정을 누르면 폼이 그 사람으로 채워진다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    const row = await rowOf('홍길동')
    await user.click(within(row).getByRole('button', { name: '수정' }))

    expect(
      screen.getByRole('heading', { name: '구성원 수정' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveValue('홍길동')
  })

  it('퇴사로 표시하면 이름은 그대로 두고 재직 여부만 바꾼다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    const row = await rowOf('홍길동')
    await user.click(within(row).getByRole('button', { name: '퇴사로 표시' }))

    await waitFor(() => {
      expect(updateMember).toHaveBeenCalledWith('m1', {
        name: '홍길동',
        active: false,
      })
    })
  })

  it('삭제는 한 번 더 확인한 뒤에 실행한다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    const row = await rowOf('홍길동')
    await user.click(within(row).getByRole('button', { name: '삭제' }))

    expect(deleteMember).not.toHaveBeenCalled()
    expect(
      within(row).getByText(/참석 기록이 있으면 삭제되지 않습니다/),
    ).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(deleteMember).toHaveBeenCalledWith('m1'))
  })

  it('참석 기록이 있어 지울 수 없으면 대신 할 일을 알려 준다', async () => {
    // 서버는 409 만 준다. "지금 상태에서는 할 수 없습니다" 로는 무엇을 하라는 건지 알 수 없다.
    vi.mocked(deleteMember).mockRejectedValue(
      new ApiError('CONFLICT', '지금 상태에서는 이 작업을 할 수 없습니다.', {
        status: 409,
      }),
    )
    const user = userEvent.setup()
    renderWithRouter(<MembersPage />)

    const row = await rowOf('홍길동')
    await user.click(within(row).getByRole('button', { name: '삭제' }))
    await user.click(within(row).getByRole('button', { name: '삭제' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('구성원을 삭제하지 못했습니다.')
    expect(alert).toHaveTextContent('재직 여부를 꺼 두면')
  })

  it('명단이 비면 무엇을 하면 되는지 알려 준다', async () => {
    vi.mocked(fetchMembers).mockResolvedValue([])
    renderWithRouter(<MembersPage />)

    expect(
      await screen.findByText(/등록된 구성원이 없습니다/),
    ).toBeInTheDocument()
  })

  it('조회 등급에는 명단만 보이고 편집 수단이 없다', async () => {
    renderWithRouter(<MembersPage />, { session: VIEWER_SESSION })

    expect(await screen.findByText('홍길동')).toBeInTheDocument()
    expect(screen.queryByLabelText('이름')).toBeNull()
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull()
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
  })
})
