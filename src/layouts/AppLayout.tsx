import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import Sidebar from '../components/layout/Sidebar'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  EventFormContext,
  type EventFormContextValue,
} from '../contexts/EventFormContext'
import type { CalendarEvent } from '../types/domain'
import styles from './AppLayout.module.css'

/**
 * 좌측 제어 영역 + 우측 출력 영역으로 구성된 앱 공통 레이아웃.
 * 1024px 미만에서는 제어 영역이 드로어로 전환된다.
 */
function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  // 화면을 이동하면 드로어를 닫는다.
  // effect 로 처리하면 렌더가 한 번 더 도는 데다 닫히기 전 화면이 잠깐 보이므로,
  // 렌더 중에 직전 경로와 비교해 상태를 조정한다.
  const [renderedPathname, setRenderedPathname] = useState(pathname)
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    setIsSidebarOpen(false)
  }

  /*
   * 드로어가 열려 있는 동안 포커스를 그 안에 가둔다.
   * 데스크톱에서는 사이드바가 화면을 덮지 않으므로 가두면 안 된다 — 드로어
   * 폭에서 열어 둔 채 창을 넓힌 경우까지 고려해 매체 질의로 함께 판단한다.
   */
  const sidebarRef = useRef<HTMLElement>(null)
  const isDrawer = useMediaQuery('(max-width: 1023px)')
  useFocusTrap(sidebarRef, isSidebarOpen && isDrawer)

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((isOpen) => !isOpen),
    [],
  )

  /*
   * 수정할 일정은 캘린더(상세 팝업)에서 고르고 사이드바의 폼이 받는다.
   * 두 컴포넌트가 형제라 여기서 들고 있는다.
   */
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const eventForm = useMemo<EventFormContextValue>(
    () => ({
      editingEvent,
      startEdit: (event) => {
        setEditingEvent(event)
        // 좁은 화면에서는 폼이 드로어 안에 있어 열어 주지 않으면 보이지 않는다
        setIsSidebarOpen(true)
      },
      startCreate: () => setEditingEvent(null),
    }),
    [editingEvent],
  )

  useEffect(() => {
    if (!isSidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  return (
    <EventFormContext value={eventForm}>
      <div className={styles.layout}>
        {/* 사이드바에 제어가 많아 키보드로 본문까지 가는 길이 길다 */}
        <a href="#main" className={styles.skipLink}>
          본문으로 건너뛰기
        </a>

        <AppHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <div className={styles.body}>
          <Sidebar ref={sidebarRef} open={isSidebarOpen} />

          {isSidebarOpen ? (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="제어 영역 닫기"
              onClick={closeSidebar}
            />
          ) : null}

          <main id="main" tabIndex={-1} className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </EventFormContext>
  )
}

export default AppLayout
