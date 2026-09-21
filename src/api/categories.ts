import { apiClient } from './client'
import type { Category } from '../types/domain'
import type { CategoryKey } from '../constants/categories'

/**
 * 카테고리 API (KAN-38).
 *
 * 마지막 남아 있던 더미다. 이제 `src/api/*` 전체가 실제 서버를 본다.
 */

type ApiResponse<T> = { data: T }

/** docs/api-contract.md §5 */
type CategoryDto = {
  id: string
  key: CategoryKey
  name: string
}

/**
 * 카테고리 목록.
 *
 * 색상은 응답에 없다. 프론트 디자인 토큰이 명도 대비 4.5:1 기준으로 고른 값을
 * 들고 있고 회귀 테스트가 지킨다(KAN-64) — 서버가 색을 보내면 그 기준이 조용히
 * 무너진다. `key` 가 `tokens.css` 의 `[data-category]` 와 이어 주는 고리다.
 *
 * 조회 등급에서는 서버가 카드/경비를 빼고 내려준다(KAN-35). 프론트는 등급을
 * 몰라도 되고, 받은 목록을 그대로 그리면 된다.
 *
 * 자주 바뀌지 않아 오래 캐시한다 — `useCategories` 참고.
 */
export async function fetchCategories(): Promise<Category[]> {
  const { data } =
    await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories')
  return data.data
}
