import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../router/routes'
import styles from './AppHeader.module.css'

const NAV_ITEMS = [
  { to: ROUTES.calendar, label: '캘린더', end: true },
  { to: ROUTES.projects, label: '과제 관리', end: false },
]

type AppHeaderProps = {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

function AppHeader({ isSidebarOpen, onToggleSidebar }: AppHeaderProps) {
  const { session, signOut } = useAuth()
  const isViewer = session?.authenticated === true && session.tier === 'VIEWER'

  return (
    <header className={styles.header}>
      {/* 데스크톱에서는 사이드바가 항상 보이므로 숨긴다 */}
      <button
        type="button"
        className={styles.menuButton}
        aria-label="제어 영역 열기"
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        onClick={onToggleSidebar}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            d="M2 4.5h14M2 9h14M2 13.5h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className={styles.brand}>Lab Calendar</span>

      <nav className={styles.nav} aria-label="주요 메뉴">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive
                ? `${styles.navLink} ${styles.navLinkActive}`
                : styles.navLink
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* 등급 표시와 세션 종료 */}
      <div className={styles.slotEnd}>
        {/*
          조회 전용임을 화면에 남겨 둔다 (KAN-36). 등록 버튼이 없는 것만으로는
          권한이 없어서인지 기능이 없어서인지 알 수 없다.
        */}
        {isViewer ? <span className={styles.tierBadge}>조회 전용</span> : null}

        {session?.authenticated ? (
          <button
            type="button"
            className={styles.signOutButton}
            onClick={() => void signOut()}
          >
            나가기
          </button>
        ) : null}
      </div>
    </header>
  )
}

export default AppHeader
