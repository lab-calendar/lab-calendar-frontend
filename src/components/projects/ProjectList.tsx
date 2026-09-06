import { useState } from 'react'
import { toProjectInput } from '../../api/projects'
import {
  useDeleteProject,
  useSaveProject,
} from '../../queries/useProjectMutations'
import type { Project } from '../../types/domain'
import { formatEventPeriod } from '../../utils/date'
import { formatDDay } from './dDay'
import styles from './ProjectList.module.css'

type ProjectListProps = {
  projects: Project[]
  editingId: string | null
  onEdit: (project: Project) => void
  /** 수정 중이던 과제가 사라졌을 때 폼을 새 과제로 되돌린다. */
  onEditingRemoved: () => void
}

/** 과제 목록 (기획서 3.1). D-Day 와 준비 기간은 서버가 계산한 값을 그대로 쓴다. */
function ProjectList({
  projects,
  editingId,
  onEdit,
  onEditingRemoved,
}: ProjectListProps) {
  const saveProject = useSaveProject()
  const deleteProject = useDeleteProject()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (projects.length === 0) {
    return (
      <p className={styles.empty}>
        등록된 과제가 없습니다. 마감일과 준비 기간을 등록하면 캘린더에 준비 기간
        일정이 자동으로 생깁니다.
      </p>
    )
  }

  function toggleActive(project: Project) {
    saveProject.mutate({
      id: project.id,
      input: { ...toProjectInput(project), active: !project.active },
    })
  }

  function remove(project: Project) {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        setConfirmingId(null)
        if (project.id === editingId) onEditingRemoved()
      },
    })
  }

  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li
          key={project.id}
          className={project.active ? styles.item : styles.inactiveItem}
          data-category="project"
        >
          <div className={styles.head}>
            <div className={styles.titleGroup}>
              <span className={styles.name}>{project.name}</span>
              {project.submissionStage ? (
                <span className={styles.stage}>{project.submissionStage}</span>
              ) : null}
            </div>
            {project.active ? (
              <span className={styles.dDay}>{formatDDay(project.dDay)}</span>
            ) : (
              <span className={styles.inactiveBadge}>캘린더에서 숨김</span>
            )}
          </div>

          <dl className={styles.meta}>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>제출 마감</dt>
              <dd className={styles.metaValue}>
                {formatEventPeriod(project.endDate, project.endDate)}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>준비 기간</dt>
              <dd className={styles.metaValue}>
                {formatEventPeriod(
                  project.preparationStartDate,
                  project.endDate,
                )}
                <span className={styles.leadTime}>
                  {project.leadTimeWeeks}주
                </span>
              </dd>
            </div>
          </dl>

          {confirmingId === project.id ? (
            <div className={styles.actions}>
              <span className={styles.confirmText}>
                삭제하면 캘린더의 준비 기간 일정도 사라집니다.
              </span>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={deleteProject.isPending}
                onClick={() => remove(project)}
              >
                {deleteProject.isPending ? '삭제 중…' : '삭제'}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setConfirmingId(null)}
              >
                취소
              </button>
            </div>
          ) : (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                onClick={() => onEdit(project)}
              >
                수정
              </button>
              <button
                type="button"
                className={styles.button}
                disabled={saveProject.isPending}
                onClick={() => toggleActive(project)}
              >
                {project.active ? '캘린더에서 숨기기' : '캘린더에 표시'}
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setConfirmingId(project.id)}
              >
                삭제
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export default ProjectList
