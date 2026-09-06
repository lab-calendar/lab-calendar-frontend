import { describe, expect, it } from 'vitest'
import { datesFromCalendarRange } from './eventDates'

describe('datesFromCalendarRange', () => {
  it('배타적 종료일에서 하루를 빼 표시 마지막 날로 만든다', () => {
    expect(datesFromCalendarRange('2026-09-08', '2026-09-27')).toEqual({
      startDate: '2026-09-08',
      endDate: '2026-09-26',
    })
  })

  it('하루짜리 일정의 기간을 그대로 유지한다', () => {
    expect(datesFromCalendarRange('2026-09-10', '2026-09-11')).toEqual({
      startDate: '2026-09-10',
      endDate: '2026-09-10',
    })
  })

  it('종료일이 없으면 시작일과 같게 둔다', () => {
    expect(datesFromCalendarRange('2026-09-10', null)).toEqual({
      startDate: '2026-09-10',
      endDate: '2026-09-10',
    })
  })

  it('월 경계를 넘어도 하루가 밀리지 않는다', () => {
    expect(datesFromCalendarRange('2026-09-28', '2026-10-01')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-09-30',
    })
  })

  it('시각이 붙은 문자열에서도 날짜만 쓴다', () => {
    expect(
      datesFromCalendarRange('2026-09-10T00:00:00+09:00', '2026-09-11T00:00:00+09:00'),
    ).toEqual({ startDate: '2026-09-10', endDate: '2026-09-10' })
  })
})
