import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetDb } from '../mocks/data/db'
import { server } from '../mocks/server'
import { resetScenario } from '../mocks/scenario'

/**
 * 이 테스트 파일에서 목 API 를 쓴다고 선언한다 (KAN-70).
 *
 * `vi.mock` 으로 어댑터를 갈아 끼우는 기존 방식은 어댑터가 서버와 주고받는 구간
 * (요청 형태, 상태 코드 해석, 에러 정규화)을 통째로 건너뛴다. 이 방식은 그 구간까지
 * 지나가므로, 계약이 어긋나면 테스트가 먼저 알려 준다.
 *
 * 날짜를 넘기면 D-Day 처럼 오늘에 기대는 값이 고정된다 — 넘기지 않으면 실제 오늘을
 * 쓰므로, 그런 값을 단언하는 테스트는 날짜를 반드시 지정한다.
 */
export function setUpMockApi(options: { today?: string } = {}): void {
  // 핸들러가 없는 요청은 실수로 진짜 네트워크에 나가는 것이므로 오류로 잡는다
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  beforeEach(() => {
    resetDb(options)
    resetScenario()
  })

  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}
