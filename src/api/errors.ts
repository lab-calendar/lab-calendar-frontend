import { AxiosError } from 'axios'

export type ApiErrorKind =
  /** 인증 필요 또는 만료 (401) */
  | 'UNAUTHORIZED'
  /** 권한 부족 — 조회 등급이 쓰기를 시도한 경우 등 (403) */
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  /** 요청 값 검증 실패 (400) */
  | 'VALIDATION'
  | 'SERVER'
  /** 네트워크 단절, 타임아웃 등 응답 자체가 없는 경우 */
  | 'NETWORK'
  | 'UNKNOWN'

/**
 * 화면이 다루는 단일 에러 타입.
 * axios 에러든 다른 예외든 여기로 정규화해서 컴포넌트가 상태 코드를 직접 보지 않게 한다.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  /** 필드별 검증 오류 (KAN-29 공통 응답 포맷) */
  readonly fieldErrors?: Record<string, string>

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status
    this.fieldErrors = options.fieldErrors
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  UNAUTHORIZED: '인증이 필요합니다. 비밀번호를 다시 입력해 주세요.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  VALIDATION: '입력한 내용을 다시 확인해 주세요.',
  SERVER: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  NETWORK: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

/** 서버 공통 에러 응답 (KAN-29). 형태가 확정되면 여기만 맞추면 된다. */
type ErrorResponseBody = {
  message?: string
  fieldErrors?: Record<string, string>
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const { response } = error
    if (!response) {
      return new ApiError('NETWORK', MESSAGES.NETWORK)
    }

    const kind = kindFromStatus(response.status)
    const body = response.data as ErrorResponseBody | undefined

    return new ApiError(kind, body?.message ?? MESSAGES[kind], {
      status: response.status,
      fieldErrors: body?.fieldErrors,
    })
  }

  return new ApiError('UNKNOWN', MESSAGES.UNKNOWN)
}
