import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import ToastProvider from '../components/common/ToastProvider'

/** 테스트마다 캐시를 격리하고 재시도를 끈다. */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/**
 * 라우터와 쿼리 컨텍스트가 필요한 컴포넌트를 렌더링한다.
 * `route` 로 쿼리 파라미터가 붙은 초기 URL 을 지정할 수 있다.
 *
 * 컨텍스트는 `wrapper` 로 넘긴다. JSX 로 직접 감싸면 `rerender` 가 래퍼를
 * 함께 갈아치워 컨텍스트가 사라진다.
 *
 * 저장·삭제 훅이 결과 알림을 내므로 실제 앱과 같이 ToastProvider 도 감싼다.
 */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}
