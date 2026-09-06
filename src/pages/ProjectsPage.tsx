import Placeholder from '../components/common/Placeholder'
import styles from './Page.module.css'

/** 연구 과제 관리 화면. */
function ProjectsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>과제 관리</h1>
        <p className={styles.subtitle}>
          연구 과제의 종료일과 리드타임을 등록하면 준비 기간 일정이 자동으로
          생성됩니다.
        </p>
      </div>

      <div className={styles.surface}>
        <Placeholder
          title="과제 목록 · 등록 폼"
          description="과제명, 제출 단계, 종료일, 리드타임 관리"
          issue="KAN-51"
        />
      </div>
    </div>
  )
}

export default ProjectsPage
