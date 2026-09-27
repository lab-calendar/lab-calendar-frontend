import { apiClient } from './client'
import type { Member, MemberInput } from '../types/domain'

/**
 * 랩실 구성원 API (KAN-41, 연동은 KAN-74).
 *
 * 로그인 계정이 아니라 이름 명단이다. 접근 권한은 공용 비밀번호가 정하고(KAN-21),
 * 이 목록은 "일정에 누구를 넣을 수 있는가"만 말한다.
 */

type ApiResponse<T> = { data: T }

/** docs/api-contract.md §8.3 */
type MemberDto = {
  id: string
  name: string
  active: boolean
}

/**
 * 명단 전체. 떠난 사람도 함께 온다.
 *
 * 서버가 재직 중인 사람을 먼저, 그 안에서 이름순으로 정렬해 준다. 고르는 자리에서는
 * 재직 중인 사람만 추려 쓰고(`activeMembers`), 관리 화면은 떠난 사람도 봐야 하므로
 * 목록 하나를 두 곳이 나눠 쓴다.
 */
export async function fetchMembers(): Promise<Member[]> {
  const { data } = await apiClient.get<ApiResponse<MemberDto[]>>('/api/members')
  return data.data
}

export async function createMember(input: MemberInput): Promise<Member> {
  const { data } = await apiClient.post<ApiResponse<MemberDto>>(
    '/api/members',
    input,
  )
  return data.data
}

export async function updateMember(
  id: string,
  input: MemberInput,
): Promise<Member> {
  const { data } = await apiClient.put<ApiResponse<MemberDto>>(
    `/api/members/${id}`,
    input,
  )
  return data.data
}

/**
 * 한 번도 쓰이지 않은 구성원만 지워진다.
 *
 * 일정의 참석자나 담당자로 한 번이라도 들어갔으면 서버가 409 로 거절한다. 지우면
 * 지난 일정에서 그 사람이 사라지기 때문이다. 떠난 사람은 재직 여부를 꺼서 남긴다.
 */
export async function deleteMember(id: string): Promise<void> {
  await apiClient.delete(`/api/members/${id}`)
}

/** 고르는 자리에 올릴 사람들. 떠난 사람은 뺀다. */
export function activeMembers(members: Member[] | undefined): Member[] {
  return (members ?? []).filter((member) => member.active)
}
