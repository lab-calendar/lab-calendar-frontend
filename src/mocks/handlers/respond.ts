import { HttpResponse, delay } from 'msw'
import { currentTier } from '../data/db'
import { isFailing, scenarioDelay, type MockDomain } from '../scenario'

/**
 * 응답을 만드는 공통 규칙 (KAN-70).
 *
 * 실제 서버의 껍데기를 그대로 흉내 낸다 — 성공은 `{ data }` 로 감싸고, 실패는
 * `{ code, message, fieldErrors }` 를 감싸지 않고 그대로 준다. 여기가 어긋나면
 * 목에서는 되는데 실제 API 에서는 화면이 빈다.
 */

/** 서버의 ErrorCode 와 같은 이름·문구를 쓴다. */
const ERRORS = {
  INVALID_REQUEST: { status: 400, message: '요청 형식을 확인해 주세요.' },
  VALIDATION_FAILED: { status: 400, message: '입력값을 확인해 주세요.' },
  UNAUTHORIZED: { status: 401, message: '인증이 필요합니다.' },
  FORBIDDEN: { status: 403, message: '이 작업을 수행할 권한이 없습니다.' },
  NOT_FOUND: { status: 404, message: '요청한 데이터를 찾을 수 없습니다.' },
  CONFLICT: {
    status: 409,
    message: '현재 데이터 상태에서는 요청을 처리할 수 없습니다.',
  },
  INTERNAL_ERROR: {
    status: 500,
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  },
} as const

export type ErrorCode = keyof typeof ERRORS

/** 일부러 넣은 지연. 0 이면 기다리지 않는다. */
async function applyDelay(): Promise<void> {
  const ms = scenarioDelay()
  if (ms > 0) await delay(ms)
}

export async function ok<T>(data: T, status = 200): Promise<Response> {
  await applyDelay()
  return HttpResponse.json({ data }, { status })
}

export async function noContent(): Promise<Response> {
  await applyDelay()
  return new HttpResponse(null, { status: 204 })
}

export async function fail(
  code: ErrorCode,
  fieldErrors: Record<string, string> = {},
): Promise<Response> {
  await applyDelay()
  const { status, message } = ERRORS[code]
  return HttpResponse.json({ code, message, fieldErrors }, { status })
}

/** `mockApi.fail('events')` 로 꺼 둔 도메인인지. 꺼져 있으면 500 을 돌려준다. */
export async function failIfScenario(
  domain: MockDomain,
): Promise<Response | null> {
  return isFailing(domain) ? fail('INTERNAL_ERROR') : null
}

/**
 * 인증 인터셉터가 하는 일을 그대로 한다.
 *
 * - 세션이 없으면 401. 프론트의 401 리스너가 비밀번호 화면으로 돌려보낸다.
 * - 읽기가 아닌 요청을 조회 등급이 보내면 403. 화면에서 버튼을 감추는 것은 편의일
 *   뿐이고 막는 쪽은 서버라는 것이 이 앱의 전제다 (KAN-35).
 */
export async function guard(method: string): Promise<Response | null> {
  const tier = currentTier()
  if (tier === null) return fail('UNAUTHORIZED')

  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    method.toUpperCase(),
  )
  if (isWrite && tier !== 'EDITOR') return fail('FORBIDDEN')

  return null
}
