import { describe, expect, it } from 'vitest'
import { addDays, formatDateTime, formatEventPeriod, overlaps } from './date'

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

describe('formatDateTime', () => {
  it('월·일과 시각만 남긴다', () => {
    // 마지막 동기화처럼 "방금인가 어제인가" 를 보는 자리라 연도는 붙이지 않는다
    const local = new Date(2026, 8, 28, 14, 5)

    expect(formatDateTime(local.toISOString())).toBe('9월 28일 14:05')
  })

  it('한 자리 시각도 두 자리로 맞춘다', () => {
    const local = new Date(2026, 8, 1, 9, 0)

    expect(formatDateTime(local.toISOString())).toBe('9월 1일 09:00')
  })

  it('읽을 수 없는 값은 받은 그대로 둔다', () => {
    // 서버가 예상 못 한 형식을 주더라도 "Invalid Date" 가 화면에 나가지는 않게 한다
    expect(formatDateTime('어제')).toBe('어제')
  })
})
