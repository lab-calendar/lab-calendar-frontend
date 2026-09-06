import type { CalendarEvent, DateRange } from '../types/domain'
import { overlaps } from '../utils/date'

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
 */
export async function fetchEvents(range: DateRange): Promise<CalendarEvent[]> {
  return DUMMY_EVENTS.filter((event) => overlaps(event, range))
}

/**
 * 실제 API 연동 시 삭제한다.
 * 날짜는 항상 이번 달에 보이도록 오늘을 기준으로 만든다.
 */
function dayOfThisMonth(day: number): string {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${dayOfMonth}`
}

const DUMMY_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'BRL 과제',
    detail: '연차보고서',
    startDate: dayOfThisMonth(8),
    endDate: dayOfThisMonth(26),
    categoryKey: 'project',
    memo: '종료 3주 전부터 자동 생성된 준비 기간입니다.',
    participants: [],
    source: 'AUTO_GENERATED',
  },
  {
    id: '2',
    title: '학술지 논문',
    detail: '심사 마감',
    startDate: dayOfThisMonth(19),
    endDate: dayOfThisMonth(19),
    categoryKey: 'project',
    participants: [],
    source: 'MANUAL',
  },
  {
    id: '3',
    title: '정기 주간 랩미팅',
    detail: '홍길동',
    startDate: dayOfThisMonth(10),
    endDate: dayOfThisMonth(10),
    categoryKey: 'lab',
    participants: ['홍길동', '김철수'],
    source: 'MANUAL',
  },
  {
    id: '4',
    title: '공용 장비 정기 점검',
    detail: '김철수',
    startDate: dayOfThisMonth(17),
    endDate: dayOfThisMonth(18),
    categoryKey: 'lab',
    participants: ['김철수'],
    source: 'MANUAL',
  },
  {
    id: '5',
    title: '[법인카드 A]',
    detail: '다과비',
    startDate: dayOfThisMonth(10),
    endDate: dayOfThisMonth(10),
    categoryKey: 'card',
    memo: 'BRL 정기 연구 회의 다과비',
    participants: ['홍길동', '김철수', '이영희'],
    source: 'GOOGLE_SYNC',
  },
  {
    id: '6',
    title: '[연구비카드 B]',
    detail: '학회 등록비',
    startDate: dayOfThisMonth(23),
    endDate: dayOfThisMonth(23),
    categoryKey: 'card',
    participants: ['이영희'],
    source: 'GOOGLE_SYNC',
  },
]
