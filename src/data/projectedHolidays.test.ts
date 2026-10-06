import { describe, expect, it } from 'vitest'
import { projectedHolidays } from './projectedHolidays'
import { holidayNamesOn, holidayNotice, KOREAN_PUBLIC_HOLIDAYS } from './publicHolidays'

describe('미래 공휴일 계산', () => {
  it('2028년 추석과 개천절 중복은 10월 5일 한 번만 대체한다', () => {
    expect(holidayNamesOn('2028-10-03')).toEqual(['개천절', '추석'])
    expect(holidayNamesOn('2028-10-05')).toEqual(['대체공휴일(개천절·추석)'])
    expect(holidayNamesOn('2028-10-06')).toEqual([])
  })
  it.each([2026, 2027])('계산 결과가 %i년 확인된 목록과 일치한다', (year) => {
    const expected = KOREAN_PUBLIC_HOLIDAYS.filter((h) => h.date.startsWith(String(year)) && h.name !== '전국동시지방선거')
    expect(projectedHolidays(year)).toEqual(expected)
  })
  it('2028년 이후를 조회할 때 계산하고 재조회에도 중복되지 않는다', () => {
    expect(holidayNamesOn('2028-01-01')).toEqual(['신정'])
    expect(holidayNamesOn('2028-01-01')).toEqual(['신정'])
    expect(holidayNamesOn('2028-05-02')).toEqual(['부처님오신날'])
    expect(holidayNamesOn('2029-05-21')).toEqual(['대체공휴일(부처님오신날)'])
    expect(holidayNotice(2028)).toContain('예정 날짜')
  })
  it('2050년까지 음력 변환이 성공하고 이후는 양력 공휴일과 누락 안내를 제공한다', () => {
    for (let year = 2028; year <= 2050; year++) {
      const entries = projectedHolidays(year)
      expect(entries.filter((h) => h.name === '설날')).toHaveLength(3)
      expect(entries.filter((h) => h.name === '추석')).toHaveLength(3)
      expect(entries.filter((h) => h.name === '부처님오신날')).toHaveLength(1)
      for (const { date } of entries) expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(date)
    }
    expect(holidayNamesOn('2100-01-01')).toEqual(['신정'])
    expect(projectedHolidays(2051).some((h) => h.name === '설날')).toBe(false)
    expect(holidayNotice(2051)).toContain('양력 공휴일만')
    expect(holidayNotice(2027)).toBeNull()
  })
})
