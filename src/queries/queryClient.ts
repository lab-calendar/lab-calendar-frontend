import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // 인증·권한·검증 오류는 다시 시도해도 결과가 같다. 재시도는 서버/네트워크 문제일 때만.
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.kind === 'SERVER' || error.kind === 'NETWORK') {
              return failureCount < 2
            }
            return false
          }
          return false
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
