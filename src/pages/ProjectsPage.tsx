import { useState } from 'react'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import ProjectForm from '../components/projects/ProjectForm'
import ProjectList from '../components/projects/ProjectList'
import { useProjects } from '../queries/useProjects'
import type { Project } from '../types/domain'
import styles from './Page.module.css'

/** 연구 과제 관리 화면 (기획서 3.1). */
function ProjectsPage() {
  const {
    data: projects,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjects()
  const [editingId, setEditingId] = useState<string | null>(null)

  // 목록을 다시 받아도 수정 중인 과제를 잃지 않도록 id 로 다시 찾는다.
  const editingProject = projects?.find((p) => p.id === editingId) ?? null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>과제 관리</h1>
        <p className={styles.subtitle}>
          연구 과제의 마감일과 준비 기간을 등록하면 캘린더에 준비 기간 일정이
          자동으로 생성됩니다.
        </p>
      </div>

      {/* 백엔드 연동(KAN-48)이 끝나면 제거한다 */}
      <p className={styles.notice}>
        백엔드 연동 전이라 임시 데이터를 표시합니다.
      </p>

      <div className={styles.split}>
        <section className={styles.panel}>
          <ProjectForm
            editingProject={editingProject}
            onDone={() => setEditingId(null)}
          />
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>등록된 과제</h2>

          {isPending ? (
            <LoadingState
              label="과제를 불러오는 중입니다"
              lines={3}
              lineHeight="6rem"
            />
          ) : isError ? (
            <ErrorState
              title="과제를 불러오지 못했습니다."
              error={error}
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          ) : (
            <ProjectList
              projects={projects}
              editingId={editingId}
              onEdit={(project: Project) => setEditingId(project.id)}
              onEditingRemoved={() => setEditingId(null)}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default ProjectsPage
