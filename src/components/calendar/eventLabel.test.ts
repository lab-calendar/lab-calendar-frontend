import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../types/domain'
import { formatEventHoverText, formatEventLabel } from './eventLabel'

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

  it('카드는 콜론으로 구분을 잇는다', () => {
    // 장부 B열(과제=카드) + D열(구분). 서버는 대괄호도 콜론도 붙이지 않는다
    const label = formatEventLabel(
      event({ categoryKey: 'card', title: 'BRL', detail: '저녁' }),
    )

    expect(label).toBe('BRL: 저녁')
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

describe('formatEventHoverText (KAN-61)', () => {
  it('칩 문구 아래에 참석 인원을 붙인다', () => {
    // 카드 칩에는 카드 종류와 구분만 들어간다. 정산할 때 궁금한 인원은 여기로 나온다.
    const hover = formatEventHoverText(
      event({
        categoryKey: 'card',
        title: 'BRL',
        detail: '저녁',
        participants: ['홍길동', '김철수', '이영희'],
      }),
    )

    expect(hover).toBe('BRL: 저녁\n참석 홍길동, 김철수, 이영희 · 총 3명')
  })

  it('참석자가 없으면 칩 문구만 쓴다', () => {
    expect(
      formatEventHoverText(
        event({ categoryKey: 'card', title: 'BRL', detail: '점심' }),
      ),
    ).toBe('BRL: 점심')
  })

  it('사람이 많으면 앞쪽만 늘어놓고 나머지는 수로 접는다', () => {
    // 실제 장부에 스무 명짜리 회의가 있다. 그대로 이으면 말풍선이 화면을 덮는다.
    const participants = Array.from({ length: 11 }, (_, index) => `참석자${index + 1}`)

    const hover = formatEventHoverText(
      event({
        categoryKey: 'card',
        title: '과제A',
        detail: '초과',
        participants,
      }),
    )

    expect(hover).toContain('참석자8 외 3명')
    expect(hover).toContain('· 총 11명')
    expect(hover).not.toContain('참석자9,')
  })

  it('구분이 없으면 과제명만 남고 인원은 그대로 붙는다', () => {
    // 실제 장부에서 구분이 빈 행이 12% 라, 서버가 detail 을 null 로 내려준다
    const hover = formatEventHoverText(
      event({ categoryKey: 'card', title: 'BRL', participants: ['홍길동'] }),
    )

    expect(hover).toBe('BRL\n참석 홍길동 · 총 1명')
  })

  it('카드가 아닌 일정에도 같은 방식으로 붙는다', () => {
    const hover = formatEventHoverText(
      event({
        categoryKey: 'lab',
        title: '정기 주간 랩미팅',
        detail: '홍길동',
        participants: ['홍길동', '김철수'],
      }),
    )

    expect(hover).toBe('정기 주간 랩미팅 (홍길동)\n참석 홍길동, 김철수 · 총 2명')
  })
})
