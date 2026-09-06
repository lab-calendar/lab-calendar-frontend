import axios from 'axios'
import { toApiError } from './errors'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
})

// 화면과 쿼리 훅이 axios 에러를 직접 다루지 않도록 여기서 ApiError 로 정규화한다.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
