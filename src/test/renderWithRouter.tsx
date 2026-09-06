import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

/**
 * 라우터 컨텍스트가 필요한 컴포넌트를 렌더링한다.
 * `initialEntries` 로 쿼리 파라미터가 붙은 초기 URL 을 지정할 수 있다.
 */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}
