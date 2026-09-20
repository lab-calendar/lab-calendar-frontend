import type { Category } from '../types/domain'

/**
 * 카테고리 목록.
 *
 * TODO(KAN-38 완료 후): 실제 API 호출로 교체한다.
 *   const { data } = await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories')
 *   return data.data
 *
 * 일정·과제는 서버에 붙었지만(KAN-71) 이것만 남았다. `GET /api/categories` 가 아직
 * 없어서다. 세 가지는 서버가 마이그레이션으로 심어 두는 고정 값이라, 그때까지 같은
 * 값을 여기서 돌려주는 것으로 화면이 정상 동작한다.
 *
 * 다만 **조회 등급에서 카드/경비가 빠지지 않는다.** 서버가 응답에서 빼 주기로 되어
 * 있고(KAN-35), 여기서 등급을 보고 거르면 그 책임이 프론트로 옮겨 온다. KAN-38 이
 * 붙으면 자연히 해결되므로 그대로 둔다.
 */
export async function fetchCategories(): Promise<Category[]> {
  return CATEGORIES
}

/** 서버의 `category` 시드와 같은 값 (KAN-28 마이그레이션). */
const CATEGORIES: Category[] = [
  { id: 1, key: 'project', name: '과제/연구 관리' },
  { id: 2, key: 'lab', name: '랩실 주기적 일정' },
  { id: 3, key: 'card', name: '카드/경비 사용' },
]
