import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchSession, login, logout } from '../../api/auth'
import { setUnauthorizedListener } from '../../api/client'
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext'
import type { Session } from '../../types/domain'

const SIGNED_OUT: Session = { authenticated: false }

type AuthProviderProps = {
  children: React.ReactNode
}

/**
 * 인증 상태를 들고 있는다 (KAN-36).
 *
 * 세션 쿠키는 HttpOnly 라 자바스크립트가 읽지 못한다. 그래서 새로고침하면 등급을
 * 서버에 다시 물어봐야 하고, 그 답이 오기 전까지는 인증 여부를 모르는 상태
 * (`session === null`) 가 실제로 존재한다. 이 상태를 "미인증" 으로 뭉뚱그리면
 * 재방문할 때마다 비밀번호 화면이 한 번 깜빡인다.
 *
 * TanStack Query 대신 직접 상태로 들고 있는 이유는, 세션이 화면에 그리는 데이터가
 * 아니라 라우팅을 가르는 조건이라서다. 캐시 무효화·재조회 같은 것이 끼어들면
 * 로그인 직후 한 박자 늦게 반영되는 문제를 다루게 된다.
 */
function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false

    fetchSession()
      .then((restored) => {
        if (!cancelled) setSession(restored)
      })
      .catch(() => {
        // 서버가 죽었든 401 이든, 확인되지 않았으면 들여보내지 않는다.
        if (!cancelled) setSession(SIGNED_OUT)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * 토큰이 만료되면 어떤 요청이든 401 로 돌아온다. 그 순간 세션을 비워 비밀번호
   * 화면으로 돌려보낸다. 남아 있던 캐시는 이전 등급이 보던 내용이라 함께 버린다 —
   * 편집 등급이 보던 카드 지출이 조회 등급으로 다시 들어온 화면에 남으면 안 된다.
   */
  useEffect(() => {
    setUnauthorizedListener(() => {
      setSession(SIGNED_OUT)
      queryClient.clear()
    })
    return () => setUnauthorizedListener(null)
  }, [queryClient])

  const signIn = useCallback(
    async (password: string) => {
      const next = await login(password)
      // 앞 사람이 보던 것이 남지 않도록 비우고 시작한다.
      queryClient.clear()
      setSession(next)
      return next
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      // 서버 호출이 실패해도 이 브라우저에서는 나간 것으로 친다.
      queryClient.clear()
      setSession(SIGNED_OUT)
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isRestoring: session === null, signIn, signOut }),
    [session, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
