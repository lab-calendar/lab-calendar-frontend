import { authHandlers } from './auth'
import { cardImportHandlers } from './cardImports'
import { categoryHandlers } from './categories'
import { eventHandlers } from './events'
import { memberHandlers } from './members'
import { projectHandlers } from './projects'

/**
 * 목 서버가 가로채는 요청 전부 (KAN-70).
 *
 * 도메인별로 나눠 두었다. 백엔드에 엔드포인트가 하나 늘면 그 도메인 파일만 열면 된다.
 * 여기 없는 요청은 그대로 네트워크로 나간다.
 */
export const handlers = [
  ...authHandlers,
  ...cardImportHandlers,
  ...categoryHandlers,
  ...eventHandlers,
  ...projectHandlers,
  ...memberHandlers,
]
