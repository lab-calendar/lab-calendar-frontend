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
