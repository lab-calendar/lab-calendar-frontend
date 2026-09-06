import CategoryFilter from '../calendar/CategoryFilter'
import Placeholder from '../common/Placeholder'
import styles from './Sidebar.module.css'

type SidebarProps = {
  /** 1024px 미만에서 드로어가 열려 있는지 여부 */
  open: boolean
}

/**
 * 좌측 제어 영역 (기획서 2.1).
 * 데스크톱에서는 항상 보이고, 그 아래 폭에서는 드로어로 열고 닫는다.
 */
function Sidebar({ open }: SidebarProps) {
  return (
    <aside
      id="sidebar"
      aria-label="제어 영역"
      className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}
    >
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>카테고리 필터</h2>
        <CategoryFilter />
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
