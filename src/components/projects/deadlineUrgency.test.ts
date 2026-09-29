import { describe, expect, it } from 'vitest'
import type { Project } from '../../types/domain'
import { attentionNeeded, needsAttention, urgencyOf } from './deadlineUrgency'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'BRL 과제',
    endDate: '2026-09-26',
    leadTimeDays: 21,
    active: true,
    dDay: 3,
    preparationStartDate: '2026-09-05',
    // 임박 여부는 서버가 정한다. 여기서는 그 규칙(오늘 포함 7일)을 흉내 내 자리를 채운다
    deadlineImminent: (overrides.dDay ?? 3) >= 0 && (overrides.dDay ?? 3) <= 7,
    ...overrides,
  }
}

describe('urgencyOf', () => {
  it('서버가 임박이라고 하면 임박이다', () => {
    // "마감 직전 주간" 의 기준은 서버에 있다 (계약 §7.1). 화면은 그 판단을 받아 쓴다
    expect(urgencyOf({ dDay: 3, deadlineImminent: true })).toBe('imminent')
    expect(urgencyOf({ dDay: 0, deadlineImminent: true })).toBe('imminent')
  })

  it('서버가 아니라고 하면 평범하다', () => {
    expect(urgencyOf({ dDay: 9, deadlineImminent: false })).toBe('normal')
    expect(urgencyOf({ dDay: 90, deadlineImminent: false })).toBe('normal')
  })

  it('남은 날짜로 임박을 다시 판단하지 않는다', () => {
    /*
     * 서버가 기준을 바꾸면(예: 열흘 전부터) 화면이 그대로 따라가야 한다. dDay 를
     * 보고 다시 재면 서버가 임박이라 한 과제에 빨간불이 켜지지 않는다.
     */
    expect(urgencyOf({ dDay: 9, deadlineImminent: true })).toBe('imminent')
    expect(urgencyOf({ dDay: 2, deadlineImminent: false })).toBe('normal')
  })

  it('지난 마감은 임박과 구분한다', () => {
    // 달력은 둘을 같이 칠하지만, 위젯과 알림은 다르게 보여준다
    expect(urgencyOf({ dDay: -1, deadlineImminent: false })).toBe('overdue')
    expect(urgencyOf({ dDay: -100, deadlineImminent: false })).toBe('overdue')
  })

  it('마감이 지났으면 임박 플래그보다 먼저 본다', () => {
    // 서버는 지난 마감에 임박을 주지 않지만, 순서가 뒤집히면 지난 마감이 묻힌다
    expect(urgencyOf({ dDay: -2, deadlineImminent: true })).toBe('overdue')
  })
})

describe('needsAttention', () => {
  it('임박한 것과 지난 것만 챙긴다', () => {
    expect(needsAttention({ dDay: 3, deadlineImminent: true })).toBe(true)
    expect(needsAttention({ dDay: -3, deadlineImminent: false })).toBe(true)
    expect(needsAttention({ dDay: 30, deadlineImminent: false })).toBe(false)
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
