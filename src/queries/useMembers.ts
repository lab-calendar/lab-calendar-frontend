import { useQuery } from '@tanstack/react-query'
import { fetchMembers } from '../api/members'
import { queryKeys } from './queryKeys'

/**
 * 랩실 구성원 명단 (KAN-74).
 *
 * 관리 화면과 일정 폼의 고르는 자리가 같이 쓴다. 명단은 카테고리만큼이나 드물게
 * 바뀌므로 오래 캐시해, 일정을 등록할 때마다 다시 받지 않는다.
 */
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: fetchMembers,
    staleTime: 10 * 60 * 1000,
  })
}
