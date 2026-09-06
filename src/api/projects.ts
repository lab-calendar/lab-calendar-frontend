import type { Project, ProjectInput } from '../types/domain'
import { decorateProject, projectRecords } from './dummyDb'
import { ApiError } from './errors'

/**
 * 과제 목록 조회.
 *
 * TODO(KAN-48 완료 후): 아래 더미 대신 실제 API를 호출한다.
 *   const { data } = await apiClient.get<ApiResponse<ProjectDto[]>>('/api/projects')
 *   return data.data.map(toProject)
 *
 * 마감이 가까운 순으로 정렬해 내려준다. 비활성 과제는 뒤로 보낸다 —
 * 목록을 여는 목적이 "다음에 뭘 준비해야 하나" 이기 때문이다.
 */
export async function fetchProjects(): Promise<Project[]> {
  return projectRecords
    .map(decorateProject)
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.endDate.localeCompare(b.endDate)
    })
}

/**
 * 과제 생성.
 *
 * TODO(KAN-48 완료 후): 실제 API 호출로 교체한다.
 *   const { data } = await apiClient.post<ApiResponse<ProjectDto>>('/api/projects', input)
 *   return toProject(data.data)
 *
 * 서버는 저장과 함께 준비 기간 일정을 만든다(KAN-49). 그래서 이 호출이 끝나면
 * 과제 목록뿐 아니라 일정 쿼리도 함께 무효화해야 한다 — `useProjectMutations` 참고.
 */
export async function createProject(input: ProjectInput): Promise<Project> {
  const record = { ...input, id: `local-${crypto.randomUUID()}` }
  projectRecords.push(record)
  return decorateProject(record)
}

/**
 * 과제 수정.
 *
 * TODO(KAN-48 완료 후): 실제 API 호출로 교체한다.
 *   const { data } = await apiClient.put<ApiResponse<ProjectDto>>(`/api/projects/${id}`, input)
 *   return toProject(data.data)
 */
export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<Project> {
  const index = projectRecords.findIndex((project) => project.id === id)
  if (index === -1) {
    throw new ApiError('NOT_FOUND', '수정할 과제를 찾을 수 없습니다.')
  }

  const updated = { ...input, id }
  projectRecords[index] = updated
  return decorateProject(updated)
}

/**
 * 과제 삭제.
 *
 * TODO(KAN-48 완료 후): 실제 API 호출로 교체한다.
 *   await apiClient.delete(`/api/projects/${id}`)
 */
export async function deleteProject(id: string): Promise<void> {
  const index = projectRecords.findIndex((project) => project.id === id)
  if (index === -1) {
    throw new ApiError('NOT_FOUND', '삭제할 과제를 찾을 수 없습니다.')
  }
  projectRecords.splice(index, 1)
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
