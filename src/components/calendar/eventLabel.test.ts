import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../types/domain'
import { formatEventLabel } from './eventLabel'

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: '1',
    title: '제목',
    startDate: '2026-09-01',
    endDate: '2026-09-01',
    categoryKey: 'project',
    participants: [],
    source: 'MANUAL',
    ...overrides,
  }
}

describe('formatEventLabel', () => {
  it('과제는 제출 단계를 괄호로 덧붙인다', () => {
    const label = formatEventLabel(
      event({ categoryKey: 'project', title: 'BRL 과제', detail: '연차보고서' }),
    )

    expect(label).toBe('BRL 과제 (연차보고서)')
  })

  it('랩실 일정은 담당 연구원을 괄호로 덧붙인다', () => {
    const label = formatEventLabel(
      event({ categoryKey: 'lab', title: '정기 주간 랩미팅', detail: '홍길동' }),
    )

    expect(label).toBe('정기 주간 랩미팅 (홍길동)')
  })

  it('카드는 콜론으로 지출 목적을 잇는다', () => {
    const label = formatEventLabel(
      event({ categoryKey: 'card', title: '[법인카드 A]', detail: '다과비' }),
    )

    expect(label).toBe('[법인카드 A]: 다과비')
  })

  it('덧붙일 값이 없으면 제목만 쓴다', () => {
    expect(formatEventLabel(event({ title: '연구실 청소' }))).toBe('연구실 청소')
  })
})
