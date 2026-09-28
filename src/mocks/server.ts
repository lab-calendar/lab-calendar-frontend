import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * 테스트에서 도는 목 서버 (KAN-70).
 *
 * 브라우저와 같은 핸들러를 쓴다. 지금까지의 테스트는 `vi.mock` 으로 어댑터 함수를
 * 갈아 끼워 왔는데, 그 방식은 어댑터가 서버와 주고받는 부분(요청 형태, 상태 코드
 * 해석, 에러 정규화)을 건너뛴다. 이 서버를 쓰면 그 구간까지 함께 검증된다.
 *
 * 기존 테스트를 한꺼번에 옮기지는 않는다. 새로 쓰는 테스트부터 쓰고, 옮길 이유가
 * 생긴 테스트만 옮긴다.
 */
export const server = setupServer(...handlers)
