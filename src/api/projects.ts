import { apiClient } from './client'
import type { Project, ProjectInput } from '../types/domain'

/**
 * 연구 과제 API (KAN-47).
 *
 * `dDay` 와 `preparationStartDate` 는 서버가 계산해 내려준다. 화면에서 다시 계산하지
 * 않는다 — 기기 시계가 틀어져 있거나 타임존이 다르면 사람마다 다른 D-Day 를 보게 된다.
 */

type ApiResponse<T> = { data: T }

/** docs/api-contract.md §7.1 */
type ProjectDto = {
  id: string
  name: string
  submissionStage: string | null
  endDate: string
  leadTimeDays: number
  active: boolean
  dDay: number
  preparationStartDate: string
}

function toProject(dto: ProjectDto): Project {
  return {
    id: dto.id,
    name: dto.name,
    submissionStage: dto.submissionStage ?? undefined,
    endDate: dto.endDate,
    leadTimeDays: dto.leadTimeDays,
    active: dto.active,
    dDay: dto.dDay,
    preparationStartDate: dto.preparationStartDate,
  }
}

function toDto(input: ProjectInput) {
  return {
    name: input.name,
    // 값 없음을 null 로 보낸다. 키를 빼면 서버가 "비우기"와 "그대로 두기"를 구분하지 못한다.
    submissionStage: input.submissionStage ?? null,
    endDate: input.endDate,
    leadTimeDays: input.leadTimeDays,
    active: input.active,
  }
}

/**
 * 과제 목록 조회.
 *
 * 정렬은 서버가 한다 — 활성 과제가 먼저, 그 안에서 마감이 가까운 순. 목록을 여는
 * 목적이 "다음에 뭘 준비해야 하나" 이기 때문이다.
 */
export async function fetchProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<ApiResponse<ProjectDto[]>>('/api/projects')
  return data.data.map(toProject)
}

/**
 * 과제 생성.
 *
 * 서버가 저장과 함께 준비 기간 일정을 만든다(KAN-49). 그래서 이 호출이 끝나면 과제
 * 목록뿐 아니라 일정 쿼리도 함께 무효화해야 한다 — `useProjectMutations` 참고.
 */
export async function createProject(input: ProjectInput): Promise<Project> {
  const { data } = await apiClient.post<ApiResponse<ProjectDto>>(
    '/api/projects',
    toDto(input),
  )
  return toProject(data.data)
}

/** 마감일이나 준비 기간을 바꾸면 서버가 준비 기간 일정도 함께 옮긴다. */
export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<Project> {
  const { data } = await apiClient.put<ApiResponse<ProjectDto>>(
    `/api/projects/${id}`,
    toDto(input),
  )
  return toProject(data.data)
}

/** 삭제하면 서버가 준비 기간 일정도 함께 지운다. */
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`)
}

/** 도메인 과제에서 생성·수정 입력값만 뽑는다. */
export function toProjectInput(project: Project): ProjectInput {
  const {
    id: _id,
    dDay: _dDay,
    preparationStartDate: _preparationStartDate,
    ...input
  } = project
  return input
}
