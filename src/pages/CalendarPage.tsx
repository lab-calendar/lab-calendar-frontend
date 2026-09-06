import MonthCalendar from '../components/calendar/MonthCalendar'
import styles from './Page.module.css'

/** 메인 캘린더 화면 (기획서 2.1 우측 출력 영역). */
function CalendarPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>월간 일정</h1>
        <p className={styles.subtitle}>
          한 달간의 전체 일정을 카테고리별 색상으로 확인합니다.
        </p>
      </div>

      {/* KAN-42에서 실제 조회 API를 연동하면서 제거한다 */}
      <p className={styles.notice}>
        임시 데이터로 표시 중입니다. 실제 일정 연동은 KAN-42에서 진행합니다.
      </p>

      <div className={styles.fillSurface}>
        <MonthCalendar />
      </div>
    </div>
  )
}

export default CalendarPage
