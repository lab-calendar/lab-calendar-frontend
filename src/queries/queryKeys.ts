import type { DateRange } from '../types/domain'

/**
 * 쿼리 키를 한곳에 모아 둔다.
 * 무효화할 때 접두사만으로 묶어서 지울 수 있도록 계층을 유지한다.
 */
export const queryKeys = {
  categories: ['categories'] as const,

  projects: ['projects'] as const,

  members: ['members'] as const,

  events: {
    all: ['events'] as const,
    list: (range: DateRange | null) => ['events', 'list', range] as const,
  },

  /** 카드 내역 동기화의 마지막 결과 (KAN-60) */
  cardSync: ['card-sync'] as const,
} as const
