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

  describe('과제에서 자동으로 만든 준비 기간', () => {
    it('기획서 문구대로 작성 요망과 준비 시작을 붙인다', () => {
      // 기획서 3.1 — "[작성 요망] BRL 과제 연차보고서 준비 시작"
      const label = formatEventLabel(
        event({
          source: 'AUTO_GENERATED',
          title: 'BRL 과제',
          detail: '연차보고서',
        }),
      )

      expect(label).toBe('[작성 요망] BRL 과제 연차보고서 준비 시작')
    })

    it('제출 단계가 없으면 과제명만 넣는다', () => {
      const label = formatEventLabel(
        event({ source: 'AUTO_GENERATED', title: 'BRL 과제' }),
      )

      expect(label).toBe('[작성 요망] BRL 과제 준비 시작')
    })

    it('공백뿐인 제출 단계는 없는 것으로 본다', () => {
      // 두 칸 띄어진 "BRL 과제  준비 시작" 이 되지 않게
      const label = formatEventLabel(
        event({ source: 'AUTO_GENERATED', title: 'BRL 과제', detail: '  ' }),
      )

      expect(label).toBe('[작성 요망] BRL 과제 준비 시작')
    })

    it('손으로 넣은 과제 일정은 그대로 둔다', () => {
      const label = formatEventLabel(
        event({ source: 'MANUAL', title: 'BRL 과제', detail: '연차보고서' }),
      )

      expect(label).toBe('BRL 과제 (연차보고서)')
    })
  })
})
