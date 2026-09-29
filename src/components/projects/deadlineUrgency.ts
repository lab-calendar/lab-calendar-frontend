import type { Project } from '../../types/domain'

/**
 * 마감이 얼마나 급한지 (KAN-53).
 *
 * 기획서 3.1 — "마감 직전 주간에는 빨간색 하이라이팅". 판단은 **서버가 한다**.
 * 캘린더와 D-Day 위젯은 그 결과를 같이 쓰므로 두 화면이 어긋날 일이 없다.
 */
export type Urgency =
  /** 마감이 지났는데 아직 끝내지 않은 것 */
  | 'overdue'
  /** 마감 직전 주간 */
  | 'imminent'
  | 'normal'

/**
 * 서버가 내려준 값으로만 판단한다.
 *
 * 임박 여부는 `deadlineImminent`, 지난 마감은 `dDay` 부호를 본다. 여기서 날짜를
 * 다시 빼거나 "며칠 이내" 를 자체 상수로 두면, 기기 시계가 틀어졌거나 서버가
 * 기준을 바꿨을 때 사람마다 다른 날에 빨간불이 켜진다 (KAN-52 와 같은 이유).
 *
 * 지난 마감을 먼저 본다 — 서버는 마감이 지난 과제에 `deadlineImminent` 를 주지
 * 않으므로, 순서가 바뀌면 지난 마감이 `normal` 로 떨어진다.
 */
export function urgencyOf(project: Pick<Project, 'dDay' | 'deadlineImminent'>): Urgency {
  if (project.dDay < 0) return 'overdue'
  return project.deadlineImminent ? 'imminent' : 'normal'
}

/** 강조해야 하는지. 지난 마감과 임박한 마감을 함께 본다. */
export function needsAttention(
  project: Pick<Project, 'dDay' | 'deadlineImminent'>,
): boolean {
  return urgencyOf(project) !== 'normal'
}

/**
 * 지금 챙겨야 할 과제들. 급한 순서는 서버 정렬을 그대로 따른다.
 *
 * 숨긴 과제는 뺀다 — 캘린더에서 내리려고 끈 것을 알림이 다시 들이밀면 끈 의미가 없다.
 */
export function attentionNeeded(projects: Project[]): Project[] {
  return projects.filter((project) => project.active && needsAttention(project))
}
