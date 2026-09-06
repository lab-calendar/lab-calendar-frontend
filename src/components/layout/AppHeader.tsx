import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../router/routes'
import styles from './AppHeader.module.css'

const NAV_ITEMS = [
  { to: ROUTES.calendar, label: '캘린더', end: true },
  { to: ROUTES.projects, label: '과제 관리', end: false },
]

function AppHeader() {
  return (
    <header className={styles.header}>
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
