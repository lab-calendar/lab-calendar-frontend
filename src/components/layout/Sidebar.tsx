import Placeholder from '../common/Placeholder'
import styles from './Sidebar.module.css'

/**
 * 좌측 제어 영역 (기획서 2.1).
 * 각 섹션의 실제 내용은 후속 이슈에서 채운다.
 */
function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="제어 영역">
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>카테고리 필터</h2>
        <Placeholder
          title="카테고리별 선택 조회"
          description="과제/연구 · 랩실 일정 · 카드/경비"
          issue="KAN-43"
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>일정 등록</h2>
        <Placeholder
          title="일정 등록 · 수정 폼"
          description="항목 유형 선택 후 기간과 정보를 입력"
          issue="KAN-44"
        />
      </section>
    </aside>
  )
}

export default Sidebar
