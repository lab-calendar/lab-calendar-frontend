import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
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
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
