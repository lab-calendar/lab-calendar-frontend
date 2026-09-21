import type { Project } from '../../types/domain'

/**
 * 마감이 얼마나 급한지 (KAN-53).
 *
 * 기획서 3.1 — "마감 직전 주간에는 빨간색 하이라이팅". 그 "직전 주간" 을 한 곳에
 * 정의해 두고 캘린더와 D-Day 위젯이 같이 쓴다. 두 화면이 서로 다른 기준으로
 * 강조하면 어느 쪽을 믿어야 할지 알 수 없다.
 */
export type Urgency =
  /** 마감이 지났는데 아직 끝내지 않은 것 */
  | 'overdue'
  /** 마감 직전 주간 */
  | 'imminent'
  | 'normal'

/** 마감 직전 "주간" — 오늘 포함 7일. */
export const IMMINENT_WITHIN_DAYS = 7

/**
 * 서버가 계산한 D-Day 로만 판단한다.
 *
 * 날짜를 여기서 다시 빼면 기기 시계가 틀어졌거나 타임존이 다를 때 사람마다 다른
 * 날에 빨간불이 켜진다 (KAN-52 와 같은 이유).
 */
export function urgencyOf(dDay: number): Urgency {
  if (dDay < 0) return 'overdue'
  return dDay <= IMMINENT_WITHIN_DAYS ? 'imminent' : 'normal'
}

/** 강조해야 하는지. 지난 마감과 임박한 마감을 함께 본다. */
export function needsAttention(dDay: number): boolean {
  return urgencyOf(dDay) !== 'normal'
}

/**
 * 지금 챙겨야 할 과제들. 급한 순서는 서버 정렬을 그대로 따른다.
 *
 * 숨긴 과제는 뺀다 — 캘린더에서 내리려고 끈 것을 알림이 다시 들이밀면 끈 의미가 없다.
 */
export function attentionNeeded(projects: Project[]): Project[] {
  return projects.filter(
    (project) => project.active && needsAttention(project.dDay),
  )
}
