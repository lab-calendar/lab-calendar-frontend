import { describe, expect, it } from 'vitest'
import { calendarDateKey, holidayNamesOn, KOREAN_PUBLIC_HOLIDAYS } from './publicHolidays'

describe('대한민국 공휴일', () => {
  it('과거의 임시공휴일과 선거일, 대체공휴일을 표시한다', () => {
    expect(holidayNamesOn('2020-08-17')).toEqual(['임시공휴일'])
    expect(holidayNamesOn('2021-10-11')).toEqual(['대체공휴일(한글날)'])
    expect(holidayNamesOn('2022-03-09')).toEqual(['대통령선거'])
    expect(holidayNamesOn('2023-05-29')).toEqual(['대체공휴일(부처님오신날)'])
    expect(holidayNamesOn('2024-10-01')).toEqual(['임시공휴일(국군의 날)'])
    expect(holidayNamesOn('2025-01-27')).toEqual(['임시공휴일'])
    expect(holidayNamesOn('2025-06-03')).toEqual(['대통령선거'])
    expect(holidayNamesOn('2025-05-05')).toEqual(['어린이날', '부처님오신날'])
  })
  it('변경된 공휴일 제도를 과거 날짜에 소급하지 않는다', () => {
    expect(holidayNamesOn('2025-05-01')).toEqual([])
    expect(holidayNamesOn('2025-07-17')).toEqual([])
    expect(holidayNamesOn('2020-03-02')).toEqual([])
    expect(holidayNamesOn('2022-05-09')).toEqual([])
  })
  it('대체공휴일과 올해 추가된 공휴일을 표시한다', () => {
    expect(holidayNamesOn('2026-10-05')).toEqual(['대체공휴일(개천절)'])
    expect(holidayNamesOn('2026-05-01')).toEqual(['노동절'])
    expect(holidayNamesOn('2027-05-03')).toEqual(['대체공휴일(노동절)'])
    expect(holidayNamesOn('2027-07-19')).toEqual(['대체공휴일(제헌절)'])
  })
  it('평일과 미제공 연도의 날짜를 공휴일로 추측하지 않는다', () => {
    expect(holidayNamesOn('2026-10-06')).toEqual([])
    expect(holidayNamesOn('2019-01-01')).toEqual([])
  })
  it('각 날짜가 실제 존재하며 연도별 공식 공휴일 수와 일치한다', () => {
    for (const holiday of KOREAN_PUBLIC_HOLIDAYS) {
      expect(new Date(`${holiday.date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(holiday.date)
    }
    expect(KOREAN_PUBLIC_HOLIDAYS.filter((h) => h.date.startsWith('2026')).length).toBe(22)
    expect(KOREAN_PUBLIC_HOLIDAYS.filter((h) => h.date.startsWith('2027')).length).toBe(24)
  })
  it('달력의 로컬 자정을 같은 날짜로 찾는다', () => {
    expect(calendarDateKey(new Date(2026, 9, 5, 0, 0))).toBe('2026-10-05')
  })
})
