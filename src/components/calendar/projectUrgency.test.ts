import { describe, expect, it } from 'vitest'
import type { CalendarEvent, Project } from '../../types/domain'
import { urgencyForEvent, urgencyLookup } from './projectUrgency'

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

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    title: 'BRL 과제',
    startDate: '2026-09-05',
    endDate: '2026-09-26',
    categoryKey: 'project',
    participants: [],
    source: 'AUTO_GENERATED',
    ...overrides,
  }
}

describe('urgencyForEvent', () => {
  it('과제명과 마감일이 맞는 생성 일정을 그 과제와 잇는다', () => {
    const lookup = urgencyLookup([project({ dDay: 3 })])

    expect(urgencyForEvent(event(), lookup)).toBe('imminent')
  })

  it('급하지 않은 과제는 강조하지 않는다', () => {
    const lookup = urgencyLookup([project({ dDay: 60 })])

    expect(urgencyForEvent(event(), lookup)).toBe('normal')
  })

  it('지난 마감도 짚어낸다', () => {
    const lookup = urgencyLookup([project({ dDay: -4 })])

    expect(urgencyForEvent(event(), lookup)).toBe('overdue')
  })

  it('손으로 넣은 일정은 보지 않는다', () => {
    // 제목과 날짜가 우연히 같아도 마감이라는 개념이 없다
    const lookup = urgencyLookup([project({ dDay: 1 })])

    expect(urgencyForEvent(event({ source: 'MANUAL' }), lookup)).toBe('normal')
  })

  it('구글에서 동기화된 일정도 보지 않는다', () => {
    const lookup = urgencyLookup([project({ dDay: 1 })])

    expect(urgencyForEvent(event({ source: 'GOOGLE_SYNC' }), lookup)).toBe(
      'normal',
    )
  })

  it('이름이 같아도 마감일이 다르면 다른 과제다', () => {
    const lookup = urgencyLookup([project({ dDay: 1, endDate: '2026-12-31' })])

    expect(urgencyForEvent(event({ endDate: '2026-09-26' }), lookup)).toBe(
      'normal',
    )
  })

  it('마감일이 같아도 이름이 다르면 다른 과제다', () => {
    const lookup = urgencyLookup([project({ dDay: 1, name: '다른 과제' })])

    expect(urgencyForEvent(event(), lookup)).toBe('normal')
  })

  it('이름 끝과 날짜 앞이 붙어 잘못 맞는 일이 없다', () => {
    /*
     * 구분자 없이 이어 붙이면 ("BRL" + "2026-09-26") 과 ("BRL2026-09-26" + "") 가
     * 같은 열쇠가 된다. 실제로 뒤쪽 이름이 생길 일은 드물지만, 붙이는 방식이
     * 틀렸는지 아닌지는 여기서 갈린다.
     */
    const lookup = urgencyLookup([
      project({ id: '1', name: 'BRL', endDate: '2026-09-26', dDay: 1 }),
    ])

    expect(
      urgencyForEvent(
        event({ title: 'BRL2026-09-26', endDate: '2026-09-26' }),
        lookup,
      ),
    ).toBe('normal')
  })

  it('숨긴 과제의 일정은 강조하지 않는다', () => {
    const lookup = urgencyLookup([project({ dDay: 1, active: false })])

    expect(urgencyForEvent(event(), lookup)).toBe('normal')
  })

  it('과제를 아직 못 받았으면 아무것도 강조하지 않는다', () => {
    expect(urgencyForEvent(event(), urgencyLookup(undefined))).toBe('normal')
  })
})
