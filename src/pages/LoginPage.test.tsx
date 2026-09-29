import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { renderWithRouter } from '../test/renderWithRouter'
import type { Session } from '../types/domain'
import LoginPage from './LoginPage'

const SIGNED_OUT: Session = { authenticated: false }

function renderLogin(signIn: (password: string) => Promise<Session>) {
  return renderWithRouter(<LoginPage />, {
    route: '/login',
    session: SIGNED_OUT,
    // 로그인 시도 자체를 검증하므로 signIn 만 갈아 끼운다
    signIn,
  })
}

describe('LoginPage', () => {
  it('입력한 비밀번호를 그대로 서버에 넘긴다', async () => {
    const signIn = vi.fn().mockResolvedValue({ authenticated: true, tier: 'EDITOR' })
    renderLogin(signIn)

    await userEvent.type(screen.getByLabelText('비밀번호'), 'lab-edit-dev')
    await userEvent.click(screen.getByRole('button', { name: '입력' }))

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('lab-edit-dev'))
  })

  it('등급을 고르는 입력이 없다', () => {
    renderLogin(vi.fn())

    // 편집용/조회용은 사용자가 고르지 않는다. 고르게 두면 등급의 존재가 드러난다.
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    // 비밀번호 입력란은 textbox 롤이 아니다 — 입력란이 이것 하나뿐임을 확인한다
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('비밀번호가 틀리면 어느 등급인지 알려주지 않는다', async () => {
    const signIn = vi.fn().mockRejectedValue(new ApiError('UNAUTHORIZED', '인증이 필요합니다.'))
    renderLogin(signIn)

    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '입력' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('비밀번호가 올바르지 않습니다.')
    expect(alert.textContent).not.toMatch(/편집|조회|EDITOR|VIEWER/)
  })

  it('실패하면 입력란을 비워 다시 칠 수 있게 한다', async () => {
    const signIn = vi.fn().mockRejectedValue(new ApiError('UNAUTHORIZED', '인증이 필요합니다.'))
    renderLogin(signIn)

    const input = screen.getByLabelText('비밀번호')
    await userEvent.type(input, 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '입력' }))

    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('서버에 닿지 못한 경우는 비밀번호 탓으로 돌리지 않는다', async () => {
    const signIn = vi
      .fn()
      .mockRejectedValue(new ApiError('NETWORK', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.'))
    renderLogin(signIn)

    await userEvent.type(screen.getByLabelText('비밀번호'), 'lab-edit-dev')
    await userEvent.click(screen.getByRole('button', { name: '입력' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결할 수 없습니다')
  })

  it('빈 비밀번호로는 서버를 부르지 않는다', async () => {
    const signIn = vi.fn()
    renderLogin(signIn)

    await userEvent.click(screen.getByRole('button', { name: '입력' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호를 입력해 주세요.')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('비밀번호는 화면에 드러나지 않는다', async () => {
    renderLogin(vi.fn())

    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password')
  })
})
