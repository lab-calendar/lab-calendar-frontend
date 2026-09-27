import { http } from 'msw'
import { currentTier, signIn, signOut } from '../data/db'
import type { MockTier } from '../data/types'
import { fail, failIfScenario, noContent, ok } from './respond'

/**
 * 인증 (KAN-21, KAN-34~36).
 *
 * 실제 서버는 비밀번호 두 개로 등급을 가른다. 목에서도 두 개를 둔다 — 하나로 두면
 * 조회 등급 화면(카드 제외, 버튼 숨김)을 확인할 방법이 없어진다.
 *
 * 비밀번호는 개발용 고정값이다. 실제 비밀번호는 서버 환경변수에만 있고 저장소에는
 * 어디에도 없다.
 */
export const MOCK_PASSWORDS: Record<string, MockTier> = {
  editor: 'EDITOR',
  viewer: 'VIEWER',
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const failure = await failIfScenario('auth')
    if (failure) return failure

    const body = (await request.json()) as { password?: unknown }
    const password = typeof body.password === 'string' ? body.password : ''

    if (!password.trim()) {
      return fail('VALIDATION_FAILED', { password: '비밀번호를 입력해 주세요.' })
    }

    const tier = MOCK_PASSWORDS[password]
    // 틀린 비밀번호는 401 이다. 어느 등급의 비밀번호가 틀렸는지도 알려 주지 않는다.
    if (!tier) return fail('UNAUTHORIZED')

    signIn(tier)
    return ok({ authenticated: true, tier })
  }),

  /** 이미 나가 있는 사람이 나가겠다고 하는 것은 오류가 아니다 — 언제나 성공한다. */
  http.post('/api/auth/logout', async () => {
    signOut()
    return noContent()
  }),

  /**
   * 지금 등급. 라우트 가드가 새로고침마다 물어본다.
   *
   * 로그인하지 않았어도 401 이 아니라 200 + `authenticated: false` 다. "로그인돼
   * 있나요?" 라는 질문에 "아니요" 는 오류가 아니라 정상적인 답이다.
   */
  http.get('/api/auth/me', async () => {
    const failure = await failIfScenario('auth')
    if (failure) return failure

    const tier = currentTier()
    return ok(
      tier === null
        ? { authenticated: false, tier: null }
        : { authenticated: true, tier },
    )
  }),
]
