import { describe, expect, it } from 'vitest'
import type { Project } from '../../types/domain'
import {
  IMMINENT_WITHIN_DAYS,
  attentionNeeded,
  needsAttention,
  urgencyOf,
} from './deadlineUrgency'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'BRL 과제',
    endDate: '2026-09-26',
    leadTimeDays: 21,
    active: true,
    dDay: 3,
    preparationStartDate: '2026-09-05',
    ...overrides,
  }
}

describe('urgencyOf', () => {
  it('마감 직전 주간은 임박으로 본다', () => {
    // 기획서 3.1 의 "마감 직전 주간"
    expect(urgencyOf(0)).toBe('imminent')
    expect(urgencyOf(3)).toBe('imminent')
    expect(urgencyOf(IMMINENT_WITHIN_DAYS)).toBe('imminent')
  })

  it('한 주를 넘기면 평범하다', () => {
    expect(urgencyOf(IMMINENT_WITHIN_DAYS + 1)).toBe('normal')
    expect(urgencyOf(90)).toBe('normal')
  })

  it('지난 마감은 임박과 구분한다', () => {
    // 달력은 둘을 같이 칠하지만, 위젯과 알림은 다르게 보여준다
    expect(urgencyOf(-1)).toBe('overdue')
    expect(urgencyOf(-100)).toBe('overdue')
  })
})

describe('needsAttention', () => {
  it('임박한 것과 지난 것만 챙긴다', () => {
    expect(needsAttention(3)).toBe(true)
    expect(needsAttention(-3)).toBe(true)
    expect(needsAttention(30)).toBe(false)
  })
})

describe('attentionNeeded', () => {
  it('급하지 않은 과제는 빼고 돌려준다', () => {
    const result = attentionNeeded([
      project({ id: '1', dDay: 3 }),
      project({ id: '2', dDay: 60 }),
      project({ id: '3', dDay: -2 }),
    ])

    expect(result.map((p) => p.id)).toEqual(['1', '3'])
  })

  it('숨긴 과제는 급해도 빼고 돌려준다', () => {
    // 캘린더에서 내리려고 끈 것을 알림이 다시 들이밀면 끈 의미가 없다
    const result = attentionNeeded([
      project({ id: '1', dDay: 1, active: false }),
      project({ id: '2', dDay: 1 }),
    ])

    expect(result.map((p) => p.id)).toEqual(['2'])
  })

  it('순서를 바꾸지 않는다', () => {
    // 급한 순서는 서버 정렬을 그대로 따른다
    const result = attentionNeeded([
      project({ id: '1', dDay: -5 }),
      project({ id: '2', dDay: 0 }),
      project({ id: '3', dDay: 7 }),
    ])

    expect(result.map((p) => p.id)).toEqual(['1', '2', '3'])
  })

  it('챙길 것이 없으면 빈 목록이다', () => {
    expect(attentionNeeded([project({ dDay: 40 })])).toEqual([])
    expect(attentionNeeded([])).toEqual([])
  })
})
