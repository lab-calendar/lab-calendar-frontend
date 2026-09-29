import MonthCalendar from '../components/calendar/MonthCalendar'
import DeadlineNotice from '../components/projects/DeadlineNotice'
import styles from './Page.module.css'

/**
 * 메인 캘린더 화면 (기획서 2.1 우측 출력 영역).
 *
 * 제목과 설명을 두지 않는다 (KAN-80). 화면을 보면 달력인 줄 아는데 그 두 줄이
 * 세로를 먹어 정작 달력이 작아졌다. 화면 이름은 읽어 주는 쪽에만 남긴다.
 */
function CalendarPage() {
  return (
    <div className={styles.page}>
      <h1 className="sr-only">월간 일정</h1>

      {/* 급한 마감이 있을 때만 달력 위에 얹힌다. 닫으면 오늘은 다시 뜨지 않는다 */}
      <DeadlineNotice />

      <div className={styles.fillSurface}>
        <MonthCalendar />
      </div>
    </div>
  )
}

export default CalendarPage
