/**
 * 앱이 다루는 도메인 모델.
 *
 * 서버 응답(DTO)과 분리해 둔다. 백엔드 응답 형태가 확정되거나 바뀌어도
 * `src/api/*` 의 어댑터에서 이 타입으로 변환하므로 화면 코드는 손대지 않는다.
 */
import type { CategoryKey } from '../constants/categories'

export type Category = {
  id: number
  /** tokens.css 의 `[data-category]` 와 매핑되는 키 */
  key: CategoryKey
  name: string
}

/** 일정이 어디서 만들어졌는지 (기획서 3.1 자동 생성, 3.2 구글 연동) */
export type EventSource = 'MANUAL' | 'AUTO_GENERATED' | 'GOOGLE_SYNC'

export type CalendarEvent = {
  id: string
  title: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD. 하루짜리 일정은 startDate 와 같다 (표시 마지막 날, 배타적 아님) */
  endDate: string
  categoryKey: CategoryKey
  memo?: string
  participants: string[]
  source: EventSource
}
