import type { CategoryKey } from '../../constants/categories'

/**
 * 라이브러리 렌더링 검증용 임시 일정.
 *
 * KAN-42에서 실제 조회 API 연동으로 대체하며, 이 파일은 그때 삭제한다.
 * 날짜는 항상 이번 달에 보이도록 오늘을 기준으로 계산한다.
 */
export type SampleEvent = {
  id: string
  title: string
  start: string
  /** FullCalendar 의 종일 일정에서 end 는 배타적이다 (표시 마지막 날 + 1일). */
  end?: string
  allDay: true
  extendedProps: { category: CategoryKey }
}

function dayOfThisMonth(day: number): string {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${dayOfMonth}`
}

export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    // 기간형 일정 — 연속된 기간 바로 렌더링되는지 확인하는 용도
    id: 'sample-1',
    title: '[작성 요망] BRL 과제 연차보고서 준비 시작',
    start: dayOfThisMonth(8),
    end: dayOfThisMonth(27),
    allDay: true,
    extendedProps: { category: 'project' },
  },
  {
    id: 'sample-2',
    title: '학술지 논문 심사 마감',
    start: dayOfThisMonth(19),
    allDay: true,
    extendedProps: { category: 'project' },
  },
  {
    id: 'sample-3',
    title: '정기 주간 랩미팅 (홍길동)',
    start: dayOfThisMonth(10),
    allDay: true,
    extendedProps: { category: 'lab' },
  },
  {
    id: 'sample-4',
    title: '공용 장비 정기 점검 (김철수)',
    start: dayOfThisMonth(17),
    end: dayOfThisMonth(19),
    allDay: true,
    extendedProps: { category: 'lab' },
  },
  {
    id: 'sample-5',
    title: '[법인카드 A]: 다과비',
    start: dayOfThisMonth(10),
    allDay: true,
    extendedProps: { category: 'card' },
  },
  {
    id: 'sample-6',
    title: '[연구비카드 B]: 학회 등록비',
    start: dayOfThisMonth(23),
    allDay: true,
    extendedProps: { category: 'card' },
  },
]
