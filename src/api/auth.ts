import { apiClient } from './client'
import type { AuthTier, Session } from '../types/domain'

/**
 * 인증 API (KAN-34, KAN-35).
 *
 * 앱에서 처음으로 실제 서버를 부르는 어댑터다. 일정·과제와 달리 더미를 두지 않았다.
 * 인증은 서버가 없으면 흉내 낼 대상 자체가 없고, 가짜로 통과시켜 두면 등급별 화면을
 * 실제와 다르게 검증하게 된다.
 *
 * 세션은 HttpOnly 쿠키에 있어 자바스크립트가 읽지 못한다. 그래서 토큰을 들고 다니지
 * 않고, 지금 등급이 무엇인지는 항상 서버에 물어본다.
 */

type SessionResponse = {
  data: {
    authenticated: boolean
    tier: AuthTier | null
  }
}

function toSession(body: SessionResponse): Session {
  const { authenticated, tier } = body.data
  // 서버가 authenticated 이면 등급을 반드시 함께 준다. 방어적으로 한 번 더 확인해
  // 등급 없는 인증 상태가 화면으로 새어 나가지 않게 한다.
  return authenticated && tier ? { authenticated: true, tier } : { authenticated: false }
}

/** 공용 비밀번호로 로그인한다. 등급은 사용자가 고르지 않고 서버가 정한다. */
export async function login(password: string): Promise<Session> {
  const { data } = await apiClient.post<SessionResponse>('/api/auth/login', {
    password,
  })
  return toSession(data)
}

/** 현재 세션. 새로고침 후 등급을 복원하는 데 쓴다. */
export async function fetchSession(): Promise<Session> {
  const { data } = await apiClient.get<SessionResponse>('/api/auth/me')
  return toSession(data)
}

/** 로그아웃. 서버가 쿠키를 만료시킨다. */
export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}
