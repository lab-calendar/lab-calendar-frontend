import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { exposeScenarioControls, readScenarioFromSearch } from './scenario'

/**
 * 브라우저에서 도는 목 서버 (KAN-70).
 *
 * 서비스 워커가 네트워크 앞에 서서 `/api/*` 요청을 가로챈다. 화면·쿼리 훅·어댑터는
 * 실제 백엔드를 볼 때와 **완전히 같은 코드**로 돈다 — 컴포넌트에 가짜 데이터를
 * 심어 두면 실제 API 로 바꿀 때 그 자리를 전부 다시 찾아내야 한다.
 */
export const worker = setupWorker(...handlers)

// 주소창의 `?mockDelay=...&mockFail=...` 과 콘솔의 `mockApi` 손잡이를 여기서 붙인다
readScenarioFromSearch(window.location.search)
exposeScenarioControls()
