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

      {/* 백엔드 연동(KAN-40)이 끝나면 제거한다 */}
      <p className={styles.notice}>
        백엔드 연동 전이라 임시 데이터를 표시합니다.
      </p>

      <div className={styles.fillSurface}>
        <MonthCalendar />
      </div>
    </div>
  )
}

export default CalendarPage
