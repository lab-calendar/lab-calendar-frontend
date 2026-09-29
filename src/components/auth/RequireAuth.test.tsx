import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext'
import type { Session } from '../../types/domain'
import RequireAuth from './RequireAuth'

function renderGuard(session: Session | null) {
  const auth: AuthContextValue = {
    session,
    isRestoring: session === null,
    signIn: () => Promise.resolve({ authenticated: false }),
    signOut: () => Promise.resolve(),
  }

  return render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/projects" element={<p>보호된 화면</p>} />
          </Route>
          <Route path="/login" element={<p>비밀번호 화면</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )
}

describe('RequireAuth', () => {
  it('인증된 사용자는 통과시킨다', () => {
    renderGuard({ authenticated: true, tier: 'EDITOR' })

    expect(screen.getByText('보호된 화면')).toBeInTheDocument()
  })

  it('조회 등급도 화면 자체는 볼 수 있다', () => {
    renderGuard({ authenticated: true, tier: 'VIEWER' })

    expect(screen.getByText('보호된 화면')).toBeInTheDocument()
  })

  it('미인증 사용자는 비밀번호 화면으로 보낸다', () => {
    renderGuard({ authenticated: false })

    expect(screen.getByText('비밀번호 화면')).toBeInTheDocument()
    expect(screen.queryByText('보호된 화면')).toBeNull()
  })

  it('세션을 확인하는 동안에는 어느 쪽도 보여주지 않는다', () => {
    // 확인 전에 내보내면 재방문할 때마다 비밀번호 화면이 한 번 깜빡인다
    renderGuard(null)

    expect(screen.queryByText('비밀번호 화면')).toBeNull()
    expect(screen.queryByText('보호된 화면')).toBeNull()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
