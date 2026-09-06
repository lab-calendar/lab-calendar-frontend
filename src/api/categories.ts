import type { Category } from '../types/domain'

/**
 * 카테고리 목록 조회.
 *
 * TODO(KAN-38 완료 후): 아래 더미 대신 실제 API를 호출한다.
 *   const { data } = await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories')
 *   return data.data.map(toCategory)
 *
 * 서버 응답 형태가 이 도메인 타입과 달라도 변환은 이 함수 안에서 끝난다.
 * 화면과 쿼리 훅은 손대지 않는다.
 */
export async function fetchCategories(): Promise<Category[]> {
  return DUMMY_CATEGORIES
}

/** 실제 API 연동 시 삭제한다. */
const DUMMY_CATEGORIES: Category[] = [
  { id: 1, key: 'project', name: '과제/연구 관리' },
  { id: 2, key: 'lab', name: '랩실 주기적 일정' },
  { id: 3, key: 'card', name: '카드/경비 사용' },
]
