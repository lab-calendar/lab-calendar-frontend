import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../api/categories'
import { queryKeys } from './queryKeys'

/**
 * 카테고리 목록.
 * 자주 바뀌지 않으므로 오래 캐시한다.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  })
}
