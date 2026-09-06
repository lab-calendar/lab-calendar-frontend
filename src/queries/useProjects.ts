import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '../api/projects'
import { queryKeys } from './queryKeys'

/** 과제 목록 (기획서 3.1). */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  })
}
