import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AuthProvider from './components/auth/AuthProvider'
import ErrorBoundary from './components/common/ErrorBoundary'
import ToastProvider from './components/common/ToastProvider'
import AppCrashPage from './pages/AppCrashPage'
import { createQueryClient } from './queries/queryClient'
import { router } from './router'
import './styles/tokens.css'
import './styles/global.css'

const queryClient = createQueryClient()

/**
 * 목 서버를 켤지 정한다 (KAN-70).
 *
 * 두 겹으로 막는다 — 개발 빌드일 것, 그리고 `VITE_ENABLE_MSW=true` 로 켜 달라고
 * 했을 것. `import.meta.env.DEV` 는 운영 빌드에서 `false` 로 치환되므로 이 안의
 * 코드와 목 데이터는 운영 번들에 실리지 않는다.
 *
 * 화면을 그리기 전에 워커가 준비될 때까지 기다린다. 먼저 그리면 첫 요청 몇 개가
 * 워커를 지나쳐 진짜 네트워크로 빠져나간다.
 */
async function startMockApi(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== 'true') return

  const { worker } = await import('./mocks/browser')
  await worker.start({
    // 가로채지 않는 요청(정적 파일 등)까지 경고하면 콘솔이 시끄러워진다
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* 라우터가 아예 뜨지 못한 경우까지 받아 내는 마지막 그물 */}
      <ErrorBoundary
        fallback={(error, reset) => (
          <AppCrashPage error={error} onRetry={reset} />
        )}
      >
        <QueryClientProvider client={queryClient}>
          {/* 라우터보다 바깥이다. 가드가 세션을 보려면 먼저 자리를 잡고 있어야 한다 */}
          <AuthProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

/*
 * 목을 켜지 못해도 화면은 뜬다. 여기서 멈추면 빈 페이지만 남아서, 워커 등록이 막힌
 * 것인지 앱이 깨진 것인지 구분할 방법이 없다. 목 없이 뜬 앱은 진짜 API 를 보므로
 * 백엔드가 없으면 오류 화면이 나오는데, 그게 빈 화면보다 훨씬 많은 것을 알려 준다.
 */
void startMockApi()
  .catch((error: unknown) => {
    console.error(
      '[mock] 목 API 를 켜지 못했습니다. 실제 API 로 진행합니다.',
      error,
    )
  })
  .then(render)
