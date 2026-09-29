import { addDays, todayIso } from '../../utils/date'
import { seedEvents, seedMembers, seedProjects } from './fixtures'
import type { MockEvent, MockMember, MockProject, MockTier } from './types'

/**
 * 목 서버가 들고 있는 상태 (KAN-70).
 *
 * 핸들러는 요청을 해석하고 응답 모양을 만드는 일만 하고, "무엇이 저장돼 있는가" 와
 * "서버가 계산해 주는 값" 은 전부 여기 모여 있다. 등록한 일정이 다음 조회에 나타나지
 * 않으면 목이 아니라 그림이라, 화면을 끝까지 눌러 볼 수 없다.
 */

type Db = {
  today: string
  tier: MockTier | null
  members: MockMember[]
  projects: MockProject[]
  /** 손으로 넣은 일정만 담는다. 준비 기간 막대는 과제에서 파생된다 (KAN-49). */
  events: MockEvent[]
  nextId: number
}

const SESSION_KEY = 'lab-calendar:mock-tier'

function restoreTier(): MockTier | null {
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY)
    return saved === 'EDITOR' || saved === 'VIEWER' ? saved : null
  } catch {
    // 세션 저장소가 막혀 있어도 목은 돌아야 한다. 새로고침에 로그인이 풀릴 뿐이다.
    return null
  }
}

function rememberTier(tier: MockTier | null): void {
  try {
    if (tier === null) window.sessionStorage.removeItem(SESSION_KEY)
    else window.sessionStorage.setItem(SESSION_KEY, tier)
  } catch {
    // 위와 같은 이유로 조용히 넘어간다
  }
}

function freshDb(today: string): Db {
  return {
    today,
    /*
     * 세션은 새로고침을 넘겨 기억한다. 실제 서버는 HttpOnly 쿠키로 같은 일을 하는데,
     * 목에서 매번 비밀번호를 다시 치게 하면 화면을 보려고 켠 목이 방해가 된다.
     */
    tier: restoreTier(),
    members: seedMembers(),
    projects: seedProjects(today),
    events: seedEvents(today),
    nextId: 100,
  }
}

let db = freshDb(todayIso())

/**
 * 테스트마다 같은 자리에서 시작하도록 되돌린다. 날짜를 고정하면 결과도 고정된다.
 *
 * 저장소까지 비운다. 메모리의 tier 만 지우면 세션 저장소에 남은 값이 다음 리셋의
 * `restoreTier()` 로 되살아나, 로그인하지 않은 채로 시작해야 할 테스트가 앞 테스트의
 * 등급을 물려받는다.
 */
export function resetDb(
  options: { today?: string; tier?: MockTier | null } = {},
): void {
  db = freshDb(options.today ?? todayIso())
  db.tier = options.tier ?? null
  rememberTier(db.tier)
}

export function mockDb(): Db {
  return db
}

export function nextId(): string {
  db.nextId += 1
  return String(db.nextId)
}

// ── 세션 ────────────────────────────────────────────────

export function currentTier(): MockTier | null {
  return db.tier
}

export function signIn(tier: MockTier): void {
  db.tier = tier
  rememberTier(tier)
}

export function signOut(): void {
  db.tier = null
  rememberTier(null)
}

// ── 서버가 계산해 주는 값 ────────────────────────────────

/** 마감까지 남은 일수. 오늘이 0, 지나면 음수다. */
export function dDayOf(endDate: string): number {
  const day = 24 * 60 * 60 * 1000
  return Math.round(
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${db.today}T00:00:00Z`)) / day,
  )
}

/** 기획서 3.1 "마감 직전 주간" — 오늘 포함 7일. 지난 마감과 숨긴 과제는 아니다. */
export function isDeadlineImminent(project: MockProject): boolean {
  const dDay = dDayOf(project.endDate)
  return project.active && dDay >= 0 && dDay <= 7
}

export function preparationStartOf(project: MockProject): string {
  return addDays(project.endDate, -project.leadTimeDays)
}

/**
 * 과제 목록 순서: 활성 과제가 먼저, 그 안에서 마감이 가까운 순.
 *
 * 이 화면을 여는 이유가 "다음에 뭘 준비해야 하나" 라서다. 프론트는 이 순서를 그대로
 * 쓰므로(정렬하지 않는다) 목도 같은 순서로 내려 줘야 한다.
 */
export function sortedProjects(): MockProject[] {
  return [...db.projects].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      a.endDate.localeCompare(b.endDate) ||
      a.id.localeCompare(b.id),
  )
}

/** 구성원 순서: 재직 중인 사람이 먼저, 그 안에서 이름순. */
export function sortedMembers(): MockMember[] {
  return [...db.members].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'ko'),
  )
}

/**
 * 과제에서 파생되는 준비 기간 일정 (KAN-49 배치가 하는 일).
 *
 * 저장해 두지 않고 읽을 때마다 만든다. 과제의 마감일이나 리드타임을 고치면 다음
 * 조회에서 막대가 따라 움직이는데, 실제 서버도 배치가 같은 결과를 만든다.
 * 캘린더에서 내린 과제(active=false)는 막대도 함께 사라진다.
 */
export function preparationEvents(): MockEvent[] {
  return db.projects
    .filter((project) => project.active)
    .map((project) => ({
      id: `prep-${project.id}`,
      title: project.name,
      detail: project.submissionStage,
      startDate: preparationStartOf(project),
      endDate: project.endDate,
      categoryKey: 'project' as const,
      memo: null,
      participants: [],
      source: 'AUTO_GENERATED' as const,
    }))
}

/** 손으로 넣은 일정 + 과제에서 파생된 막대. 카드 제외 같은 등급 규칙은 핸들러가 본다. */
export function allEvents(): MockEvent[] {
  return [...db.events, ...preparationEvents()]
}

/**
 * 이 구성원이 어딘가에 쓰이고 있는지.
 *
 * 실제 서버는 참석자·담당자 외래키를 세어 보고 쓰이고 있으면 409 로 삭제를 막는다.
 * 목에서도 같은 자리에서 막혀야, 그 안내 문구를 화면에서 확인할 수 있다.
 */
export function isMemberReferenced(name: string): boolean {
  return db.events.some(
    (event) => event.participants.includes(name) || event.detail === name,
  )
}
