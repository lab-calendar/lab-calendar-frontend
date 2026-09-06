import { ApiError } from './errors'

const FALLBACK = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 화면에 보여줄 오류 문구.
 *
 * `ApiError` 는 이미 사람이 읽을 수 있는 문구를 들고 있다(`api/errors.ts`).
 * 그 밖의 예외는 내부 메시지가 새어 나가지 않도록 공통 문구로 덮는다.
 */
export function messageFromError(error: unknown): string {
  return error instanceof ApiError ? error.message : FALLBACK
}
