import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import ToastProvider from '../components/common/ToastProvider'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import type { Session } from '../types/domain'

/** 테스트마다 캐시를 격리하고 재시도를 끈다. */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** 편집 등급이 기본값이다 — 대부분의 화면 검증은 권한과 무관하다. */
const EDITOR_SESSION: Session = { authenticated: true, tier: 'EDITOR' }

export type RenderOptions = {
  /** 쿼리 파라미터가 붙은 초기 URL */
  route?: string
  /**
   * 이 렌더에서 가정할 세션.
   *
   * 실제 AuthProvider 대신 값을 직접 꽂는다. 서버를 부르지 않아 등급별 화면을
   * 네트워크 없이 검증할 수 있고, 등급이 렌더 도중에 바뀌지도 않는다.
   */
  session?: Session
  /** 로그인 동작을 갈아 끼운다. 비밀번호 화면 검증에만 쓴다. */
  signIn?: (password: string) => Promise<Session>
  signOut?: () => Promise<void>
}

/**
 * 라우터와 쿼리 컨텍스트가 필요한 컴포넌트를 렌더링한다.
 *
 * 컨텍스트는 `wrapper` 로 넘긴다. JSX 로 직접 감싸면 `rerender` 가 래퍼를
 * 함께 갈아치워 컨텍스트가 사라진다.
 *
 * 저장·삭제 훅이 결과 알림을 내므로 실제 앱과 같이 ToastProvider 도 감싼다.
 */
export function renderWithRouter(
  ui: ReactElement,
  {
    route = '/',
    session = EDITOR_SESSION,
    signIn = () => Promise.resolve(session),
    signOut = () => Promise.resolve(),
  }: RenderOptions = {},
) {
  const queryClient = createTestQueryClient()

  const auth: AuthContextValue = {
    session,
    isRestoring: false,
    signIn,
    signOut,
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext value={auth}>
          <MemoryRouter initialEntries={[route]}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </AuthContext>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}

/** 조회 등급으로 렌더할 때 쓴다. */
export const VIEWER_SESSION: Session = { authenticated: true, tier: 'VIEWER' }
