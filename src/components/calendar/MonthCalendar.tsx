import type { EventContentArg } from '@fullcalendar/core'
import koLocale from '@fullcalendar/core/locales/ko'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import type { CategoryKey } from '../../constants/categories'
import styles from './MonthCalendar.module.css'
import { SAMPLE_EVENTS } from './sampleEvents'

/**
 * 이벤트를 카테고리 색상 토큰이 적용된 칩으로 렌더링한다.
 * `data-category` 만 지정하면 tokens.css 가 색상을 매핑한다.
 */
function renderEventContent(arg: EventContentArg) {
  const category = arg.event.extendedProps.category as CategoryKey

  return (
    <div className={styles.event} data-category={category}>
      <span className={styles.eventTitle}>{arg.event.title}</span>
    </div>
  )
}

/**
 * 월별 그리드 캘린더 (기획서 2.1 우측 출력 영역).
 *
 * 현재는 라이브러리 렌더링 검증용 임시 데이터를 사용한다.
 * 실제 일정 조회 연동은 KAN-42에서 다룬다.
 */
function MonthCalendar() {
  return (
    <div className={styles.calendar}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        height="100%"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={SAMPLE_EVENTS}
        eventContent={renderEventContent}
        fixedWeekCount={false}
        dayMaxEvents={3}
        expandRows
      />
    </div>
  )
}

export default MonthCalendar
