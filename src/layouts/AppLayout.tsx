import { Outlet } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import Sidebar from '../components/layout/Sidebar'
import styles from './AppLayout.module.css'

/** 좌측 제어 영역 + 우측 출력 영역으로 구성된 앱 공통 레이아웃. */
function AppLayout() {
  return (
    <div className={styles.layout}>
      <AppHeader />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
