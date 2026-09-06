import type { CalendarEvent, DateRange } from '../types/domain'
import { overlaps } from '../utils/date'
import { eventRecords, preparationEvents } from './dummyDb'
import { ApiError } from './errors'

/**
 * 기간 내 일정 조회.
 *
 * TODO(KAN-40 완료 후): 아래 더미 대신 실제 API를 호출한다.
 *   const { data } = await apiClient.get<ApiResponse<EventDto[]>>('/api/events', {
 *     params: { from: range.from, to: range.to },
 *   })
 *   return data.data.map(toCalendarEvent)
 *
 * 카테고리 필터는 화면에서 처리한다. 한 달치는 양이 적어 매번 다시 받는 것보다
 * 받아둔 목록을 거르는 편이 빠르고, KAN-43 의 "필터 변경 시 불필요한 재조회가
 * 없어야 한다"는 조건과도 맞는다. 서버의 categoryIds 파라미터는 남겨 두되 쓰지 않는다.
 *
 * 과제 준비 기간 일정은 저장해 두지 않고 조회할 때 과제에서 파생시킨다.
 * 실제 서비스에서는 KAN-49 배치가 만들어 두므로 서버가 함께 내려준다.
 */
export async function fetchEvents(range: DateRange): Promise<CalendarEvent[]> {
  return [...eventRecords, ...preparationEvents()].filter((event) =>
    overlaps(event, range),
  )
}

/** 일정 생성/수정 시 서버가 정하는 값은 제외한다. */
export type EventInput = Omit<CalendarEvent, 'id' | 'source'>

/**
 * 일정 생성.
 *
 * TODO(KAN-39 완료 후): 실제 API 호출로 교체한다.
 *   const { data } = await apiClient.post<ApiResponse<EventDto>>('/api/events', toDto(input))
 *   return toCalendarEvent(data.data)
 */
export async function createEvent(input: EventInput): Promise<CalendarEvent> {
  const created: CalendarEvent = {
    ...input,
    id: `local-${crypto.randomUUID()}`,
    source: 'MANUAL',
  }
  eventRecords.push(created)
  return created
}

/**
 * 일정 수정.
 *
 * TODO(KAN-39 완료 후): 실제 API 호출로 교체한다.
 *   const { data } = await apiClient.put<ApiResponse<EventDto>>(`/api/events/${id}`, toDto(input))
 *   return toCalendarEvent(data.data)
 *
 * 준비 기간 일정은 과제에서 파생되므로 여기서 찾지 못한다. 화면이 이미
 * `isEditableEvent` 로 막고 있고, 서버도 같은 이유로 거절한다.
 */
export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<CalendarEvent> {
  const index = eventRecords.findIndex((event) => event.id === id)
  if (index === -1) {
    throw new ApiError('NOT_FOUND', '수정할 일정을 찾을 수 없습니다.')
  }

  const updated: CalendarEvent = { ...eventRecords[index], ...input, id }
  eventRecords[index] = updated
  return updated
}

/**
 * 일정 삭제.
 *
 * TODO(KAN-39 완료 후): 실제 API 호출로 교체한다.
 *   await apiClient.delete(`/api/events/${id}`)
 */
export async function deleteEvent(id: string): Promise<void> {
  const index = eventRecords.findIndex((event) => event.id === id)
  if (index === -1) {
    throw new ApiError('NOT_FOUND', '삭제할 일정을 찾을 수 없습니다.')
  }
  eventRecords.splice(index, 1)
}

/** 도메인 일정에서 생성·수정 입력값만 뽑는다. */
export function toEventInput(event: CalendarEvent): EventInput {
  const { id: _id, source: _source, ...input } = event
  return input
}
