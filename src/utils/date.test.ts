import { describe, expect, it } from 'vitest'
import { addDays, formatEventPeriod, overlaps } from './date'

describe('formatEventPeriod', () => {
  it('하루짜리는 요일과 함께 한 날짜만 쓴다', () => {
    expect(formatEventPeriod('2026-09-10', '2026-09-10')).toBe(
      '2026년 9월 10일 (목)',
    )
  })

  it('같은 해 기간은 끝 날짜의 연도를 생략한다', () => {
    expect(formatEventPeriod('2026-09-08', '2026-09-26')).toBe(
      '2026년 9월 8일 (화) ~ 9월 26일 (토)',
    )
  })

  it('해가 바뀌면 끝 날짜에도 연도를 붙인다', () => {
    expect(formatEventPeriod('2026-12-28', '2027-01-05')).toBe(
      '2026년 12월 28일 (월) ~ 2027년 1월 5일 (화)',
    )
  })
})

describe('addDays', () => {
  it('하루를 더한다', () => {
    expect(addDays('2026-09-06', 1)).toBe('2026-09-07')
  })

  it('월 경계를 넘는다', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })

  it('연 경계를 넘는다', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('윤년 2월을 처리한다', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('음수도 처리한다', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('overlaps', () => {
  const range = { from: '2026-09-01', to: '2026-09-30' }

  it('기간 안에 완전히 들어오면 참', () => {
    expect(overlaps({ startDate: '2026-09-10', endDate: '2026-09-12' }, range))
      .toBe(true)
  })

  it('이전 달에 시작해 이번 달까지 이어지면 참', () => {
    expect(overlaps({ startDate: '2026-08-25', endDate: '2026-09-03' }, range))
      .toBe(true)
  })

  it('이번 달에 시작해 다음 달까지 이어지면 참', () => {
    expect(overlaps({ startDate: '2026-09-28', endDate: '2026-10-05' }, range))
      .toBe(true)
  })

  it('기간을 통째로 감싸면 참', () => {
    expect(overlaps({ startDate: '2026-08-01', endDate: '2026-10-31' }, range))
      .toBe(true)
  })

  it('경계에 걸치면 참', () => {
    expect(overlaps({ startDate: '2026-09-30', endDate: '2026-09-30' }, range))
      .toBe(true)
  })

  it('완전히 벗어나면 거짓', () => {
    expect(overlaps({ startDate: '2026-08-01', endDate: '2026-08-31' }, range))
      .toBe(false)
    expect(overlaps({ startDate: '2026-10-01', endDate: '2026-10-31' }, range))
      .toBe(false)
  })
})
