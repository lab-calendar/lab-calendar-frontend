import type { CategoryKey } from '../constants/categories'

/**
 * 쿼리 키를 한곳에 모아 둔다.
 * 무효화할 때 접두사만으로 묶어서 지울 수 있도록 계층을 유지한다.
 */
export const queryKeys = {
  categories: ['categories'] as const,

  events: {
    all: ['events'] as const,
    list: (params: { from: string; to: string; categories: CategoryKey[] }) =>
      ['events', 'list', params] as const,
  },
} as const
