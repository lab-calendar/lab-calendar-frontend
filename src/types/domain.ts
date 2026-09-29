/**
 * 앱이 다루는 도메인 모델.
 *
 * 서버 응답(DTO)과 분리해 둔다. 백엔드 응답 형태가 확정되거나 바뀌어도
 * `src/api/*` 의 어댑터에서 이 타입으로 변환하므로 화면 코드는 손대지 않는다.
 */
import type { CategoryKey } from '../constants/categories'

export type Category = {
  /** 다른 응답들과 마찬가지로 문자열이다 (계약 §5). */
  id: string
  /** tokens.css 의 `[data-category]` 와 매핑되는 키 */
  key: CategoryKey
  name: string
}

/** 랩실 구성원 등록·수정이 다루는 값 (KAN-41). */
export type MemberInput = {
  name: string
  /**
   * 재직 중인지.
   *
   * 떠난 사람도 지우지 않고 남긴다 — 지난 일정의 참석자였던 기록이 사라지면 안 된다.
   * 고르는 자리에는 재직 중인 사람만 올린다.
   */
  active: boolean
}

export type Member = MemberInput & {
  id: string
}

/**
 * 일정이 어디서 만들어졌는지 (기획서 3.1 자동 생성, 3.2 카드 내역).
 *
 * `GOOGLE_SYNC` 는 구글 API 로 직접 읽어 오던 시절의 값이다. 팀이 엑셀 업로드로
 * 방향을 바꾸면서 `CARD_IMPORT` 가 생겼고(KAN-54 설계 §6.3), 서버가 옮겨 가는
 * 동안에는 둘 다 올 수 있다. 화면에서는 같은 것으로 다룬다 — 어느 쪽이든 사람이
 * 고칠 수 없고, 고치려면 원본을 손봐야 한다.
 */
export type EventSource =
  | 'MANUAL'
  | 'AUTO_GENERATED'
  | 'GOOGLE_SYNC'
  | 'CARD_IMPORT'

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
   * - card: 구분 (점심 · 저녁 · 초과) — 장부 D열
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
  /**
   * 마감 직전 주간인지. **서버가 판단해서 내려준다.**
   *
   * "직전 주간" 의 기준은 서버에 있다(계약 §7.1). 화면에서 `dDay <= 7` 로 다시
   * 판단하면 서버가 기준을 바꿨을 때 달력의 빨간불과 서버의 판단이 갈린다 —
   * D-Day 를 서버 값으로 쓰는 것과 같은 이유다 (KAN-52).
   */
  deadlineImminent: boolean
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

/**
 * 카드 내역 엑셀 가져오기 (KAN-54 설계 §6.2).
 *
 * 구글 API 주기 동기화 대신, 사용자가 구글 시트에서 `.xlsx` 로 내려받아 올린다.
 * 올리면 먼저 미리보기가 뜨고, 확인해야 반영된다 — 달 단위로 기존 내역을 갈아
 * 끼우는 작업이라 무엇이 사라지는지 보지 않고 누르게 하면 안 된다.
 */

/** 그 달을 반영할 수 있는지. BLOCKED 는 오류 때문에 통째로 보존한다. */
export type CardImportMonthStatus = 'READY' | 'BLOCKED'

export type CardImportMonth = {
  /** `YYYY-MM` */
  month: string
  status: CardImportMonthStatus
  added: number
  /** 파일에서 사라진 행. 반영하면 달력에서 지워진다. */
  removed: number
  unchanged: number
}

/** 월 시트로 읽지 못해 건너뛴 시트 — `복사용 시트`, 연도 없는 `7월` 등 */
export type CardImportSkippedSheet = {
  sheet: string
  reason: string
}

/** ERROR 는 그 달 전체를 막고, WARNING 은 알리고 반영한다 (설계 §3.2). */
export type CardImportProblemLevel = 'ERROR' | 'WARNING'

export type CardImportProblem = {
  sheet: string
  row: number
  level: CardImportProblemLevel
  code: string
  message: string
}

export type CardImportTotals = {
  added: number
  removed: number
  unchanged: number
  /** ERROR 로 건너뛴 행 수 */
  skippedRows: number
  /** 오류 때문에 통째로 보존한 달 수 */
  blockedMonths: number
}

export type CardImportResult = {
  /** true 면 아무것도 저장하지 않은 미리보기다. */
  dryRun: boolean
  /**
   * 반영할 때 되돌려 보내야 하는 서명값.
   *
   * 미리보기를 보여준 그 상태 그대로 반영되는지 서버가 확인하는 장치다. 파일이나
   * DB 가 그새 바뀌면 409 `PREVIEW_STALE` 로 거절되고 미리보기부터 다시 받는다.
   */
  previewToken: string
  fileName: string
  months: CardImportMonth[]
  skippedSheets: CardImportSkippedSheet[]
  problems: CardImportProblem[]
  totals: CardImportTotals
}

/** 반영할 달이 하나라도 있는지. 없으면 서버가 422 로 거절한다 (설계 §3.2). */
export function hasApplicableMonth(result: CardImportResult): boolean {
  return result.months.some((month) => month.status === 'READY')
}

/**
 * 지난 업로드 한 건 (KAN-60).
 *
 * 서버의 `sync_log` 한 줄을 그대로 내려준다. 업로드 응답(`CardImportResult`)과 달리
 * 달별 집계가 없고 회차 전체의 합만 있다 — 여기에 `blockedMonths` 를 기대하면 안 된다.
 */
export type CardImportHistoryEntry = {
  id: string
  fileName: string
  /**
   * RUNNING 은 아직 끝나지 않은 회차다. 서버가 시작할 때 한 줄을 먼저 적고 끝나면
   * 고치기 때문에, 올리는 도중에 목록을 열면 이 값이 보인다.
   */
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED'
  startedAt: string
  /** 아직 끝나지 않았으면 null */
  finishedAt: string | null
  durationMs: number | null
  processed: number
  added: number
  updated: number
  removed: number
  skippedRows: number
  /** 실패한 회차의 사유 코드 (`NO_APPLICABLE_MONTHS` 등) */
  errorCode: string | null
  problemCount: number
  problems: CardImportProblem[]
}
