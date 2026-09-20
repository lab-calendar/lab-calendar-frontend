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
  /**
   * 준비 기간 길이(일). 기본 21일, 과제별로 조정한다.
   *
   * 주가 아니라 일이다 — "열흘 준비" 처럼 주로 떨어지지 않는 기간이 실제로 있고,
   * 계약도 0~182 일로 정했다 (docs/api-contract.md §7.4).
   */
  leadTimeDays: number
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

/**
 * 접근 등급 (KAN-21).
 *
 * 개인 계정이 아니라 랩실 공용 비밀번호 두 개다. 입력한 비밀번호가 등급을 정하며
 * 사용자가 고르지 않는다.
 *
 * - EDITOR: 편집용. 카드/경비를 포함해 전부 보고 고친다.
 * - VIEWER: 조회용. 외부 자문 위원이나 출장 중인 교수진에게 공유하는 등급으로,
 *   쓰기가 막히고 카드/경비가 응답에서 빠진다.
 */
export type AuthTier = 'EDITOR' | 'VIEWER'

/** 인증되지 않았으면 등급 자체가 없다. 두 상태를 한 타입에 섞지 않는다. */
export type Session =
  | { authenticated: true; tier: AuthTier }
  | { authenticated: false; tier?: never }

/**
 * 이 등급이 일정·과제를 고칠 수 있는지.
 *
 * 화면에서 숨기는 것은 편의일 뿐 보안 경계가 아니다. 실제 차단은 서버가 한다(KAN-35).
 */
export function canEdit(session: Session): boolean {
  return session.authenticated && session.tier === 'EDITOR'
}
