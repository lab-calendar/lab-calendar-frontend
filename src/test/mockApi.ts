import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetDb } from '../mocks/data/db'
import type { MockTier } from '../mocks/data/types'
import { server } from '../mocks/server'
import { resetScenario } from '../mocks/scenario'

/**
 * 테스트가 날짜를 지정하지 않았을 때 쓰는 "오늘".
 *
 * 실제 오늘을 쓰면 어제 통과하던 테스트가 오늘 깨질 수 있다. 달을 넘기는 주·월말·윤년
 * 같은 자리를 매일 새로 밟게 되기 때문이다. 고정해 두면 실패가 날짜 탓이 아니라
 * 코드 탓이라고 믿을 수 있다.
 */
export const MOCK_TODAY = '2026-09-10'

type MockApiOptions = {
  /** 이 날짜를 오늘로 둔다. 기본값 {@link MOCK_TODAY}. */
  today?: string
  /** 각 테스트를 이 등급으로 로그인한 채 시작한다. 기본값 null (로그아웃). */
  tier?: MockTier | null
}

/**
 * 이 테스트 파일에서 목 API 를 쓴다고 선언한다 (KAN-70).
 *
 * `vi.mock` 으로 어댑터를 갈아 끼우는 기존 방식은 어댑터가 서버와 주고받는 구간
 * (요청 형태, 상태 코드 해석, 에러 정규화)을 통째로 건너뛴다. 이 방식은 그 구간까지
 * 지나가므로, 계약이 어긋나면 테스트가 먼저 알려 준다.
 *
 * `tier` 를 주면 매 테스트가 로그인된 상태에서 시작한다. 등급 자체를 확인하는
 * 테스트가 아니라면 로그인 절차는 본문에서 덜어 내는 편이 읽기 쉽다.
 */
export function setUpMockApi(options: MockApiOptions = {}): void {
  // 핸들러가 없는 요청은 실수로 진짜 네트워크에 나가는 것이므로 오류로 잡는다
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  beforeEach(() => {
    resetDb({ today: options.today ?? MOCK_TODAY, tier: options.tier ?? null })
    resetScenario()
  })

  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}
