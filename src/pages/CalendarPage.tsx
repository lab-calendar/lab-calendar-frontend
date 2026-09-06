import Placeholder from '../components/common/Placeholder'
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

      <div className={styles.surface}>
        <Placeholder
          title="월별 그리드 캘린더"
          description="FullCalendar 도입 후 실제 일정 데이터를 연동합니다"
          issue="KAN-31 · KAN-42"
        />
      </div>
    </div>
  )
}

export default CalendarPage
