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
  /** 주 제목 — 과제명 / 업무명 / 카드 종류 */
  title: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD. 하루짜리 일정은 startDate 와 같다 (표시 마지막 날, 배타적 아님) */
  endDate: string
  categoryKey: CategoryKey
  /**
   * 제목 옆에 덧붙는 값. 카테고리에 따라 의미가 다르다 (기획서 2.2 표시 데이터 양식).
   * - project: 제출 단계
   * - lab: 담당 연구원
   * - card: 지출 목적
   */
  detail?: string
  memo?: string
  participants: string[]
  source: EventSource
}

/** 조회 기간. 양끝을 포함한다. */
export type DateRange = {
  from: string
  to: string
}

/**
 * 사람이 고칠 수 있는 일정인지.
 *
 * 자동 생성 일정은 배치가(KAN-49), 구글 연동 일정은 동기화가(KAN-58) 다시 만들어
 * 덮어쓴다. 고쳐도 되돌아가므로 아예 막고, 어디서 바꿔야 하는지 안내한다.
 */
export function isEditableEvent(event: CalendarEvent): boolean {
  return event.source === 'MANUAL'
}

/** 과제 등록 폼이 다루는 값 (기획서 3.1). */
export type ProjectInput = {
  /** 과제명 */
  name: string
  /** 제출 단계 — 연차보고서, 최종보고서 등. 캘린더에서 과제명 옆에 붙는다. */
  submissionStage?: string
  /** 제출 마감일 YYYY-MM-DD */
  endDate: string
  /** 준비 기간 길이(주). 기본 3주, 과제별로 조정한다. */
  leadTimeWeeks: number
  /** 끄면 준비 기간 일정이 캘린더에서 빠진다. 지난 과제를 지우지 않고 숨길 때 쓴다. */
  active: boolean
}

export type Project = ProjectInput & {
  id: string
  /**
   * 마감까지 남은 일수. **서버가 계산해서 내려준다.**
   *
   * 화면에서 다시 계산하지 않는다 — 기기 시계가 틀어져 있거나 타임존이 다르면
   * 사람마다 다른 D-Day 를 보게 된다 (KAN-52 완료 조건).
   */
  dDay: number
  /** 준비 기간 시작일. 서버가 종료일과 리드타임으로 계산한다 (KAN-49 배치). */
  preparationStartDate: string
}
