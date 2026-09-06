import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, deleteProject, updateProject } from '../api/projects'
import type { ProjectInput } from '../types/domain'
import { queryKeys } from './queryKeys'

/**
 * 과제를 저장하거나 지우면 일정 쿼리도 함께 무효화한다.
 *
 * 과제의 마감일·리드타임이 준비 기간 일정을 결정하므로(KAN-49 배치), 과제만
 * 갱신하면 캘린더에 옛 기간이 남는다. 비활성화로 일정이 사라지는 경우도 같다.
 */
function useInvalidateProjectData() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
  }
}

/** 과제를 만들거나 고친다. */
export function useSaveProject() {
  const invalidate = useInvalidateProjectData()

  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: ProjectInput }) =>
      id === null ? createProject(input) : updateProject(id, input),
    onSuccess: invalidate,
  })
}

/** 과제를 지운다. */
export function useDeleteProject() {
  const invalidate = useInvalidateProjectData()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: invalidate,
  })
}
