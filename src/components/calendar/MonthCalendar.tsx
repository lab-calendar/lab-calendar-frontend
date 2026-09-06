import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core'
import koLocale from '@fullcalendar/core/locales/ko'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, {
  type EventResizeDoneArg,
} from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useCallback, useMemo, useState } from 'react'
import type { CategoryKey } from '../../constants/categories'
import { useEventForm } from '../../contexts/EventFormContext'
import { useCategoryFilter } from '../../hooks/useCategoryFilter'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { toEventInput } from '../../api/events'
import {
  useDeleteEvent,
  useSaveEvent,
} from '../../queries/useEventMutations'
import { useEvents } from '../../queries/useEvents'
import {
  isEditableEvent,
  type CalendarEvent,
  type DateRange,
} from '../../types/domain'
import { addDays } from '../../utils/date'
import { datesFromCalendarRange } from './eventDates'
import EventDetailDialog from './EventDetailDialog'
import { formatEventLabel } from './eventLabel'
import styles from './MonthCalendar.module.css'

function toFullCalendarEvent(event: CalendarEvent): EventInput {
  return {
    id: event.id,
    title: formatEventLabel(event),
    start: event.startDate,
    // FullCalendar 의 종일 일정에서 end 는 배타적이라 표시 마지막 날 다음 날을 준다
    end: addDays(event.endDate, 1),
    allDay: true,
    // 자동 생성·구글 연동 일정은 다시 만들어져 덮어써지므로 드래그를 막는다
    editable: isEditableEvent(event),
    extendedProps: { categoryKey: event.categoryKey },
  }
}

/**
 * 이벤트를 카테고리 색상 토큰이 적용된 칩으로 렌더링한다.
 * `data-category` 만 지정하면 tokens.css 가 색상을 매핑한다.
 */
function renderEventContent(arg: EventContentArg) {
  const categoryKey = arg.event.extendedProps.categoryKey as CategoryKey

  return (
    <div className={styles.event} data-category={categoryKey}>
      <span className={styles.eventTitle}>{arg.event.title}</span>
    </div>
  )
}

/** 월별 그리드 캘린더 (기획서 2.1 우측 출력 영역). */
function MonthCalendar() {
  const { selected } = useCategoryFilter()
  const isMobile = useMediaQuery('(max-width: 767px)')

  // FullCalendar 가 알려주는 표시 기간. 뷰를 옮기면 갱신되고 그때마다 다시 조회한다.
  const [range, setRange] = useState<DateRange | null>(null)
  const { data: events, isError } = useEvents(range)

  // 상세 팝업에서 보여줄 일정. 목록이 바뀌어 사라지면 자동으로 닫힌다.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const selectedEvent =
    events?.find((event) => event.id === selectedEventId) ?? null

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedEventId(arg.event.id)
  }, [])

  const closeDetail = useCallback(() => setSelectedEventId(null), [])

  const { startEdit } = useEventForm()
  const handleEdit = useCallback(
    (event: CalendarEvent) => {
      startEdit(event)
      setSelectedEventId(null)
    },
    [startEdit],
  )

  const deleteEvent = useDeleteEvent()
  const handleDelete = useCallback(
    (event: CalendarEvent) => {
      deleteEvent.mutate(event.id, {
        onSuccess: () => setSelectedEventId(null),
      })
    },
    [deleteEvent],
  )

  /*
   * 드래그로 옮기거나 기간을 늘리면 곧바로 저장한다.
   * 저장에 실패하면 FullCalendar 가 이미 화면에서 옮겨 놓은 일정을 되돌려야
   * 화면과 데이터가 어긋나지 않는다.
   */
  const saveEvent = useSaveEvent()
  const handleEventChange = useCallback(
    async (arg: EventDropArg | EventResizeDoneArg) => {
      const original = events?.find(({ id }) => id === arg.event.id)
      if (!original) {
        arg.revert()
        return
      }

      const dates = datesFromCalendarRange(
        arg.event.startStr,
        arg.event.endStr,
      )

      try {
        await saveEvent.mutateAsync({
          id: original.id,
          input: { ...toEventInput(original), ...dates },
        })
      } catch {
        arg.revert()
      }
    },
    [events, saveEvent],
  )

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({
      from: arg.startStr.slice(0, 10),
      // endStr 은 배타적이라 하루를 빼면 실제 마지막 표시일이 된다
      to: addDays(arg.endStr.slice(0, 10), -1),
    })
  }, [])

  // 카테고리 필터는 받아둔 목록에서 거른다. 필터를 바꿔도 다시 조회하지 않는다.
  const visibleEvents = useMemo(
    () =>
      (events ?? [])
        .filter((event) => selected.includes(event.categoryKey))
        .map(toFullCalendarEvent),
    [events, selected],
  )

  return (
    <div className={styles.calendar}>
      {/* 로딩·에러 상태의 본격적인 처리는 KAN-63에서 다룬다 */}
      {isError ? (
        <p className={styles.status} role="alert">
          일정을 불러오지 못했습니다.
        </p>
      ) : null}

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        height="100%"
        headerToolbar={
          isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'prev,next today', center: 'title', right: '' }
        }
        datesSet={handleDatesSet}
        events={visibleEvents}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        // 개별 일정의 editable 로 다시 걸러진다
        editable
        fixedWeekCount={false}
        // 셀이 좁은 모바일에서는 표시 개수를 줄이고 나머지는 "+N개"로 접는다
        dayMaxEvents={isMobile ? 2 : 3}
        expandRows
      />

      <EventDetailDialog
        event={selectedEvent}
        onClose={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={deleteEvent.isPending}
      />
    </div>
  )
}

export default MonthCalendar
