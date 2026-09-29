import axios from 'axios'
import { toApiError } from './errors'

export const apiClient = axios.create({
  // 기본값을 비워 같은 출처로 보낸다. 개발 중에는 Vite 프록시가, 운영에서는 nginx 가
  // /api 를 백엔드로 넘긴다. 세션 쿠키가 같은 출처에서 가장 덜 까다롭게 붙는다.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  // 세션이 HttpOnly 쿠키라 이게 없으면 로그인해도 다음 요청에 실려 가지 않는다.
  withCredentials: true,
})

/**
 * 세션이 끊겼을 때 앱에 알리는 통로.
 *
 * 인터셉터는 리액트 바깥이라 화면 상태를 직접 건드릴 수 없다. 401 을 만나면 여기로
 * 알리고, 등록해 둔 쪽(AuthProvider)이 세션을 비워 비밀번호 화면으로 돌려보낸다.
 */
type UnauthorizedListener = () => void

let onUnauthorized: UnauthorizedListener | null = null

export function setUnauthorizedListener(listener: UnauthorizedListener | null): void {
  onUnauthorized = listener
}

// 화면과 쿼리 훅이 axios 에러를 직접 다루지 않도록 여기서 ApiError 로 정규화한다.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)

    /*
     * 로그인 실패도 401 이다. 그것까지 세션 만료로 취급하면 비밀번호를 틀린 순간
     * 화면이 리다이렉트되어 오류 메시지를 읽을 새가 없다. 인증 엔드포인트는 뺀다.
     */
    const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
    const isAuthCall = url.startsWith('/api/auth/')

    if (apiError.kind === 'UNAUTHORIZED' && !isAuthCall) {
      onUnauthorized?.()
    }

    return Promise.reject(apiError)
  },
)

