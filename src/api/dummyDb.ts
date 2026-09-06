/**
 * 백엔드가 없는 동안 쓰는 인메모리 저장소.
 *
 * 실제 API 연동(KAN-39 / KAN-40 / KAN-48)이 끝나면 이 파일을 통째로 지운다.
 * 여기 있는 계산은 전부 **서버가 할 일을 흉내 낸 것**이다. 화면과 쿼리 훅은
 * 이 파일을 직접 참조하지 않고 `api/*` 어댑터만 거치므로, 삭제해도 컴포넌트는
 * 손댈 일이 없다.
 */
import type { CalendarEvent, Project, ProjectInput } from '../types/domain'
import { addDays, todayIso } from '../utils/date'

/** 날짜가 항상 이번 달에 보이도록 오늘을 기준으로 만든다. */
function dayOfThisMonth(day: number): string {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${dayOfMonth}`
}

/** `from` 에서 `to` 까지 남은 일수. 같은 날이면 0, 지난 날이면 음수. */
function daysBetween(from: string, to: string): number {
  const toUtc = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000)
}

type ProjectRecord = ProjectInput & { id: string }

/** 저장된 과제. 서버 계산값(dDay, preparationStartDate)은 담지 않는다. */
export const projectRecords: ProjectRecord[] = [
  {
    id: 'p1',
    name: 'BRL 과제',
    submissionStage: '연차보고서',
    endDate: dayOfThisMonth(26),
    leadTimeWeeks: 3,
    active: true,
  },
  {
    id: 'p2',
    name: '한국연구재단 신진연구',
    submissionStage: '최종보고서',
    endDate: addDays(dayOfThisMonth(15), 60),
    leadTimeWeeks: 4,
    active: true,
  },
  {
    id: 'p3',
    name: '산학협력 과제',
    submissionStage: '중간보고서',
    endDate: addDays(dayOfThisMonth(10), -40),
    leadTimeWeeks: 2,
    active: false,
  },
]

/**
 * 서버가 내려줄 계산값을 붙인다.
 *
 * 준비 기간은 마감일에서 리드타임(주)만큼 거슬러 올라간 날부터 마감일까지다 —
 * "종료 3주 전부터"(기획서 3.1)를 그대로 옮긴 것이다.
 */
export function decorateProject(record: ProjectRecord): Project {
  return {
    ...record,
    dDay: daysBetween(todayIso(), record.endDate),
    preparationStartDate: addDays(record.endDate, -record.leadTimeWeeks * 7),
  }
}

/**
 * 과제의 준비 기간 일정.
 *
 * 실제 서비스에서는 KAN-49 배치가 만들어 DB 에 넣는다. 여기서는 조회할 때마다
 * 과제에서 파생시키므로 과제를 고치면 캘린더가 곧바로 따라온다.
 */
export function preparationEventOf(project: Project): CalendarEvent {
  return {
    id: `auto-${project.id}`,
    title: project.name,
    detail: project.submissionStage,
    startDate: project.preparationStartDate,
    endDate: project.endDate,
    categoryKey: 'project',
    memo: `마감 ${project.leadTimeWeeks}주 전부터 자동 생성된 준비 기간입니다.`,
    participants: [],
    source: 'AUTO_GENERATED',
  }
}

/** 활성 과제에서 파생된 준비 기간 일정 전체. */
export function preparationEvents(): CalendarEvent[] {
  return projectRecords
    .filter((record) => record.active)
    .map((record) => preparationEventOf(decorateProject(record)))
}

/** 사람이 직접 넣었거나 구글에서 동기화된 일정. 준비 기간 일정은 여기 없다. */
export const eventRecords: CalendarEvent[] = [
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
