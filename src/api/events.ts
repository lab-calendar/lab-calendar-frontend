import { apiClient } from './client'
import type { CalendarEvent, DateRange } from '../types/domain'
import type { CategoryKey } from '../constants/categories'

/**
 * 일정 API (KAN-39, KAN-40).
 *
 * 서버 응답(DTO)에서 도메인 타입으로 바꾸는 일은 전부 이 파일 안에서 끝난다.
 * 화면과 쿼리 훅은 `CalendarEvent` 만 알면 되고, 서버 응답 형태가 바뀌어도
 * 손댈 곳은 여기뿐이다.
 */

type ApiResponse<T> = { data: T }

/** docs/api-contract.md §6.1 — 양끝을 포함하는 날짜, 서버가 조합한 표시 문자열. */
type EventDto = {
  id: string
  title: string
  detail: string | null
  startDate: string
  endDate: string
  categoryKey: CategoryKey
  memo: string | null
  participants: string[]
  source: CalendarEvent['source']
}

/**
 * 서버가 값 없음을 `null` 로 보내는 자리를 도메인의 "없음"(`undefined`)으로 맞춘다.
 *
 * 섞어 두면 화면에서 `detail ?? ''` 같은 방어가 곳곳에 퍼진다.
 */
function toCalendarEvent(dto: EventDto): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    detail: dto.detail ?? undefined,
    startDate: dto.startDate,
    endDate: dto.endDate,
    categoryKey: dto.categoryKey,
    memo: dto.memo ?? undefined,
    participants: dto.participants,
    source: dto.source,
  }
}

/**
 * 기간 내 일정 조회.
 *
 * 카테고리 필터는 화면에서 처리한다. 한 달치는 양이 적어 매번 다시 받는 것보다
 * 받아둔 목록을 거르는 편이 빠르고, KAN-43 의 "필터 변경 시 불필요한 재조회가
 * 없어야 한다"는 조건과도 맞는다. 서버의 `categories` 파라미터는 쓰지 않는다.
 *
 * 과제 준비 기간 일정은 서버가 만들어(KAN-49) 이 응답에 함께 내려준다. 조회 등급은
 * 카드/경비 일정을 아예 받지 못한다(KAN-35) — 프론트가 거를 일이 아니다.
 */
export async function fetchEvents(range: DateRange): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<ApiResponse<EventDto[]>>('/api/events', {
    params: { from: range.from, to: range.to },
  })
  return data.data.map(toCalendarEvent)
}

/** 일정 생성/수정 시 서버가 정하는 값은 제외한다. */
export type EventInput = Omit<CalendarEvent, 'id' | 'source'>

/**
 * 보내는 쪽도 `undefined` 를 `null` 로 되돌린다.
 *
 * 그냥 두면 JSON 직렬화에서 키가 통째로 빠지고, 서버는 "비우기"와 "건드리지 않기"를
 * 구분할 수 없다 — 메모를 지우려는 수정이 조용히 무시된다.
 */
function toDto(input: EventInput) {
  return {
    title: input.title,
    detail: input.detail ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    categoryKey: input.categoryKey,
    memo: input.memo ?? null,
    participants: input.participants,
  }
}

export async function createEvent(input: EventInput): Promise<CalendarEvent> {
  const { data } = await apiClient.post<ApiResponse<EventDto>>(
    '/api/events',
    toDto(input),
  )
  return toCalendarEvent(data.data)
}

/**
 * 일정 수정.
 *
 * 자동 생성·구글 연동 일정은 서버가 403 으로 거절한다. 화면도 `isEditableEvent` 로
 * 진입점을 막지만, 가리는 것은 편의일 뿐이고 경계는 서버에 있다.
 */
export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<CalendarEvent> {
  const { data } = await apiClient.put<ApiResponse<EventDto>>(
    `/api/events/${id}`,
    toDto(input),
  )
  return toCalendarEvent(data.data)
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/api/events/${id}`)
}

/** 도메인 일정에서 생성·수정 입력값만 뽑는다. */
export function toEventInput(event: CalendarEvent): EventInput {
  const { id: _id, source: _source, ...input } = event
  return input
}
