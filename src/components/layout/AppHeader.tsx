import { NavLink } from 'react-router-dom'
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

      {/* D-Day 카운트다운 위젯 자리 — KAN-52 */}
      <div className={styles.slotEnd} />
    </header>
  )
}

export default AppHeader
