/**
 * 목 서버를 일부러 느리게·망가지게 만드는 손잡이 (KAN-70).
 *
 * 로딩과 오류 화면(KAN-63)은 서버가 잘 돌 때는 한순간도 볼 수 없다. 그 화면들을
 * 눈으로 확인할 방법이 없으면, 만들어 놓고 맞는지 모르는 채로 두게 된다.
 *
 * 주소창에서: `?mockDelay=1500`, `?mockFail=events,projects`, `?mockCardImport=blocked`
 * 콘솔에서: `mockApi.delay(1500)`, `mockApi.fail('events')`,
 *          `mockApi.cardImport('blocked')`, `mockApi.reset()`
 */

export const MOCK_DOMAINS = [
  'auth',
  'categories',
  'events',
  'projects',
  'members',
  'cardImports',
] as const

export type MockDomain = (typeof MOCK_DOMAINS)[number]

/**
 * 카드 내역 파일을 읽었을 때 나올 결과 (KAN-61).
 *
 * 목은 엑셀을 실제로 파싱하지 않으므로, 어떤 파일을 올리든 결과는 여기서 고른다.
 * 화면이 다뤄야 하는 갈래가 셋이다 — 그냥 반영되는 경우, 오류로 막힌 달이 섞인
 * 경우, 읽을 월 시트가 하나도 없는 경우.
 */
export const CARD_IMPORT_CASES = ['ok', 'blocked', 'empty'] as const

export type CardImportCase = (typeof CARD_IMPORT_CASES)[number]

function isCardImportCase(value: string): value is CardImportCase {
  return (CARD_IMPORT_CASES as readonly string[]).includes(value)
}

function isDomain(value: string): value is MockDomain {
  return (MOCK_DOMAINS as readonly string[]).includes(value)
}

const scenario = {
  delayMs: 0,
  failing: new Set<MockDomain>(),
  cardImport: 'ok' as CardImportCase,
}

export function scenarioDelay(): number {
  return scenario.delayMs
}

export function isFailing(domain: MockDomain): boolean {
  return scenario.failing.has(domain)
}

export function setDelay(ms: number): void {
  scenario.delayMs = Math.max(0, ms)
}

export function setFailing(domains: MockDomain[]): void {
  scenario.failing = new Set(domains)
}

export function cardImportCase(): CardImportCase {
  return scenario.cardImport
}

export function setCardImportCase(value: CardImportCase): void {
  scenario.cardImport = value
}

export function resetScenario(): void {
  scenario.delayMs = 0
  scenario.failing = new Set()
  scenario.cardImport = 'ok'
}

/** `?mockDelay=1500&mockFail=events,projects` 를 읽는다. 모르는 이름은 조용히 버린다. */
export function readScenarioFromSearch(search: string): void {
  const params = new URLSearchParams(search)

  const delay = Number(params.get('mockDelay'))
  if (Number.isFinite(delay) && delay > 0) setDelay(delay)

  const failing = (params.get('mockFail') ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(isDomain)
  if (failing.length > 0) setFailing(failing)

  const cardImport = params.get('mockCardImport') ?? ''
  if (isCardImportCase(cardImport)) setCardImportCase(cardImport)
}

/**
 * 콘솔에서 만질 수 있게 손잡이를 꺼내 둔다.
 *
 * 개발 빌드에서 목을 켰을 때만 부른다. 운영 번들에는 이 파일 자체가 실리지 않는다.
 */
export function exposeScenarioControls(): void {
  Object.defineProperty(window, 'mockApi', {
    configurable: true,
    value: {
      delay: setDelay,
      fail: (...domains: MockDomain[]) => setFailing(domains.filter(isDomain)),
      cardImport: (value: string) => {
        if (isCardImportCase(value)) setCardImportCase(value)
      },
      reset: resetScenario,
      state: () => ({
        delayMs: scenario.delayMs,
        failing: [...scenario.failing],
        cardImport: scenario.cardImport,
      }),
    },
  })
}
