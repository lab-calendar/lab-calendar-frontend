import { useMatch } from 'react-router-dom'
import { useCanEdit } from '../../contexts/AuthContext'
import { ROUTES } from '../../router/routes'
import CategoryFilter from '../calendar/CategoryFilter'
import EventForm from '../calendar/EventForm'
import styles from './Sidebar.module.css'

type SidebarProps = {
  /** 드로어일 때 포커스를 옮길 대상 */
  ref?: React.Ref<HTMLElement>
  /** 1024px 미만에서 드로어가 열려 있는지 여부 */
  open: boolean
}

/**
 * 좌측 제어 영역 (기획서 2.1).
 * 데스크톱에서는 항상 보이고, 그 아래 폭에서는 드로어로 열고 닫는다.
 *
 * 필터와 일정 등록은 캘린더 화면에만 해당한다. 과제 관리 화면에서까지 띄우면
 * 화면에 폼이 둘이 되어 어느 쪽에 입력하는지 헷갈린다.
 *
 * 조회 등급에서는 등록 폼을 내린다. 남겨 두면 다 채우고 저장을 눌렀을 때에야
 * 403 으로 거절당한다 (KAN-36).
 */
function Sidebar({ open, ref }: SidebarProps) {
  const isCalendar = useMatch(ROUTES.calendar) !== null
  const canEdit = useCanEdit()

  return (
    <aside
      ref={ref}
      id="sidebar"
      /* 안에 포커스 받을 것이 없을 때 컨테이너 자신이 받는다 */
      tabIndex={-1}
      aria-label="제어 영역"
      className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}
    >
      {isCalendar ? (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>카테고리 필터</h2>
            <CategoryFilter />
          </section>

          {canEdit ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>일정 등록</h2>
              <EventForm />
            </section>
          ) : (
            <p className={styles.note}>
              조회 전용으로 접속했습니다. 일정을 등록하거나 고치려면 편집용
              비밀번호로 다시 접속해 주세요.
            </p>
          )}
        </>
      ) : (
        <p className={styles.note}>
          {canEdit
            ? '과제 등록과 수정은 오른쪽 화면에서 합니다.'
            : '조회 전용으로 접속했습니다. 과제는 보기만 할 수 있습니다.'}
        </p>
      )}
    </aside>
  )
}

export default Sidebar
