import { LAST_LUNAR_YEAR, projectedHolidays } from './projectedHolidays'

/** 2026-10-03 확인. 출처와 갱신 절차는 docs/public-holidays.md. */
export const HOLIDAY_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027] as const

export const KOREAN_PUBLIC_HOLIDAYS: readonly { date: string; name: string }[] = [
  { date: '2020-01-01', name: '신정' },
  { date: '2020-01-24', name: '설날' },
  { date: '2020-01-25', name: '설날' },
  { date: '2020-01-26', name: '설날' },
  { date: '2020-01-27', name: '대체공휴일(설날)' },
  { date: '2020-03-01', name: '삼일절' },
  { date: '2020-04-15', name: '국회의원선거' },
  { date: '2020-04-30', name: '부처님오신날' },
  { date: '2020-05-05', name: '어린이날' },
  { date: '2020-06-06', name: '현충일' },
  { date: '2020-08-15', name: '광복절' },
  { date: '2020-08-17', name: '임시공휴일' },
  { date: '2020-09-30', name: '추석' },
  { date: '2020-10-01', name: '추석' },
  { date: '2020-10-02', name: '추석' },
  { date: '2020-10-03', name: '개천절' },
  { date: '2020-10-09', name: '한글날' },
  { date: '2020-12-25', name: '기독탄신일' },
  { date: '2021-01-01', name: '신정' },
  { date: '2021-02-11', name: '설날' },
  { date: '2021-02-12', name: '설날' },
  { date: '2021-02-13', name: '설날' },
  { date: '2021-03-01', name: '삼일절' },
  { date: '2021-05-05', name: '어린이날' },
  { date: '2021-05-19', name: '부처님오신날' },
  { date: '2021-06-06', name: '현충일' },
  { date: '2021-08-15', name: '광복절' },
  { date: '2021-08-16', name: '대체공휴일(광복절)' },
  { date: '2021-09-20', name: '추석' },
  { date: '2021-09-21', name: '추석' },
  { date: '2021-09-22', name: '추석' },
  { date: '2021-10-03', name: '개천절' },
  { date: '2021-10-04', name: '대체공휴일(개천절)' },
  { date: '2021-10-09', name: '한글날' },
  { date: '2021-10-11', name: '대체공휴일(한글날)' },
  { date: '2021-12-25', name: '기독탄신일' },
  { date: '2022-01-01', name: '신정' },
  { date: '2022-01-31', name: '설날' },
  { date: '2022-02-01', name: '설날' },
  { date: '2022-02-02', name: '설날' },
  { date: '2022-03-01', name: '삼일절' },
  { date: '2022-03-09', name: '대통령선거' },
  { date: '2022-05-05', name: '어린이날' },
  { date: '2022-05-08', name: '부처님오신날' },
  { date: '2022-06-01', name: '전국동시지방선거' },
  { date: '2022-06-06', name: '현충일' },
  { date: '2022-08-15', name: '광복절' },
  { date: '2022-09-09', name: '추석' },
  { date: '2022-09-10', name: '추석' },
  { date: '2022-09-11', name: '추석' },
  { date: '2022-09-12', name: '대체공휴일(추석)' },
  { date: '2022-10-03', name: '개천절' },
  { date: '2022-10-09', name: '한글날' },
  { date: '2022-10-10', name: '대체공휴일(한글날)' },
  { date: '2022-12-25', name: '기독탄신일' },
  { date: '2023-01-01', name: '신정' },
  { date: '2023-01-21', name: '설날' },
  { date: '2023-01-22', name: '설날' },
  { date: '2023-01-23', name: '설날' },
  { date: '2023-01-24', name: '대체공휴일(설날)' },
  { date: '2023-03-01', name: '삼일절' },
  { date: '2023-05-05', name: '어린이날' },
  { date: '2023-05-27', name: '부처님오신날' },
  { date: '2023-05-29', name: '대체공휴일(부처님오신날)' },
  { date: '2023-06-06', name: '현충일' },
  { date: '2023-08-15', name: '광복절' },
  { date: '2023-09-28', name: '추석' },
  { date: '2023-09-29', name: '추석' },
  { date: '2023-09-30', name: '추석' },
  { date: '2023-10-02', name: '임시공휴일' },
  { date: '2023-10-03', name: '개천절' },
  { date: '2023-10-09', name: '한글날' },
  { date: '2023-12-25', name: '기독탄신일' },
  { date: '2024-01-01', name: '신정' },
  { date: '2024-02-09', name: '설날' },
  { date: '2024-02-10', name: '설날' },
  { date: '2024-02-11', name: '설날' },
  { date: '2024-02-12', name: '대체공휴일(설날)' },
  { date: '2024-03-01', name: '삼일절' },
  { date: '2024-04-10', name: '국회의원선거' },
  { date: '2024-05-05', name: '어린이날' },
  { date: '2024-05-06', name: '대체공휴일(어린이날)' },
  { date: '2024-05-15', name: '부처님오신날' },
  { date: '2024-06-06', name: '현충일' },
  { date: '2024-08-15', name: '광복절' },
  { date: '2024-09-16', name: '추석' },
  { date: '2024-09-17', name: '추석' },
  { date: '2024-09-18', name: '추석' },
  { date: '2024-10-01', name: '임시공휴일(국군의 날)' },
  { date: '2024-10-03', name: '개천절' },
  { date: '2024-10-09', name: '한글날' },
  { date: '2024-12-25', name: '기독탄신일' },
  { date: '2025-01-01', name: '신정' },
  { date: '2025-01-27', name: '임시공휴일' },
  { date: '2025-01-28', name: '설날' },
  { date: '2025-01-29', name: '설날' },
  { date: '2025-01-30', name: '설날' },
  { date: '2025-03-01', name: '삼일절' },
  { date: '2025-03-03', name: '대체공휴일(삼일절)' },
  { date: '2025-05-05', name: '어린이날' },
  { date: '2025-05-05', name: '부처님오신날' },
  { date: '2025-05-06', name: '대체공휴일(어린이날·부처님오신날)' },
  { date: '2025-06-03', name: '대통령선거' },
  { date: '2025-06-06', name: '현충일' },
  { date: '2025-08-15', name: '광복절' },
  { date: '2025-10-03', name: '개천절' },
  { date: '2025-10-05', name: '추석' },
  { date: '2025-10-06', name: '추석' },
  { date: '2025-10-07', name: '추석' },
  { date: '2025-10-08', name: '대체공휴일(추석)' },
  { date: '2025-10-09', name: '한글날' },
  { date: '2025-12-25', name: '기독탄신일' },
  {
    "date": "2026-01-01",
    "name": "신정"
  },
  {
    "date": "2026-02-16",
    "name": "설날"
  },
  {
    "date": "2026-02-17",
    "name": "설날"
  },
  {
    "date": "2026-02-18",
    "name": "설날"
  },
  {
    "date": "2026-03-01",
    "name": "삼일절"
  },
  {
    "date": "2026-03-02",
    "name": "대체공휴일(삼일절)"
  },
  {
    "date": "2026-05-01",
    "name": "노동절"
  },
  {
    "date": "2026-05-05",
    "name": "어린이날"
  },
  {
    "date": "2026-05-24",
    "name": "부처님오신날"
  },
  {
    "date": "2026-05-25",
    "name": "대체공휴일(부처님오신날)"
  },
  {
    "date": "2026-06-03",
    "name": "전국동시지방선거"
  },
  {
    "date": "2026-06-06",
    "name": "현충일"
  },
  {
    "date": "2026-07-17",
    "name": "제헌절"
  },
  {
    "date": "2026-08-15",
    "name": "광복절"
  },
  {
    "date": "2026-08-17",
    "name": "대체공휴일(광복절)"
  },
  {
    "date": "2026-09-24",
    "name": "추석"
  },
  {
    "date": "2026-09-25",
    "name": "추석"
  },
  {
    "date": "2026-09-26",
    "name": "추석"
  },
  {
    "date": "2026-10-03",
    "name": "개천절"
  },
  {
    "date": "2026-10-05",
    "name": "대체공휴일(개천절)"
  },
  {
    "date": "2026-10-09",
    "name": "한글날"
  },
  {
    "date": "2026-12-25",
    "name": "기독탄신일"
  },
  {
    "date": "2027-01-01",
    "name": "신정"
  },
  {
    "date": "2027-02-06",
    "name": "설날"
  },
  {
    "date": "2027-02-07",
    "name": "설날"
  },
  {
    "date": "2027-02-08",
    "name": "설날"
  },
  {
    "date": "2027-02-09",
    "name": "대체공휴일(설날)"
  },
  {
    "date": "2027-03-01",
    "name": "삼일절"
  },
  {
    "date": "2027-05-01",
    "name": "노동절"
  },
  {
    "date": "2027-05-03",
    "name": "대체공휴일(노동절)"
  },
  {
    "date": "2027-05-05",
    "name": "어린이날"
  },
  {
    "date": "2027-05-13",
    "name": "부처님오신날"
  },
  {
    "date": "2027-06-06",
    "name": "현충일"
  },
  {
    "date": "2027-07-17",
    "name": "제헌절"
  },
  {
    "date": "2027-07-19",
    "name": "대체공휴일(제헌절)"
  },
  {
    "date": "2027-08-15",
    "name": "광복절"
  },
  {
    "date": "2027-08-16",
    "name": "대체공휴일(광복절)"
  },
  {
    "date": "2027-09-14",
    "name": "추석"
  },
  {
    "date": "2027-09-15",
    "name": "추석"
  },
  {
    "date": "2027-09-16",
    "name": "추석"
  },
  {
    "date": "2027-10-03",
    "name": "개천절"
  },
  {
    "date": "2027-10-04",
    "name": "대체공휴일(개천절)"
  },
  {
    "date": "2027-10-09",
    "name": "한글날"
  },
  {
    "date": "2027-10-11",
    "name": "대체공휴일(한글날)"
  },
  {
    "date": "2027-12-25",
    "name": "기독탄신일"
  },
  {
    "date": "2027-12-27",
    "name": "대체공휴일(기독탄신일)"
  }
]

const byDate = new Map<string, string[]>()
for (const holiday of KOREAN_PUBLIC_HOLIDAYS) {
  const names = byDate.get(holiday.date) ?? []
  if (!names.includes(holiday.name)) names.push(holiday.name)
  byDate.set(holiday.date, names)
}

export function holidayNamesOn(date: string): readonly string[] {
  const year = Number(date.slice(0, 4))
  if (year > 2027 && !projectedYears.has(year)) {
    for (const holiday of projectedHolidays(year)) {
      const names = byDate.get(holiday.date) ?? []
      if (!names.includes(holiday.name)) names.push(holiday.name)
      byDate.set(holiday.date, names)
    }
    projectedYears.add(year)
  }
  return byDate.get(date) ?? []
}

const projectedYears = new Set<number>()

export function holidayNotice(year: number): string | null {
  if (year > LAST_LUNAR_YEAR) return `${year}년은 양력 공휴일만 표시합니다. 설날·추석·부처님오신날 정보는 제공되지 않습니다. 임시공휴일·선거일은 발표 후 반영됩니다.`
  if (year > 2027) return `${year}년 공휴일은 현행 규칙으로 계산한 예정 날짜입니다. 임시공휴일·선거일과 제도 변경은 발표 후 반영됩니다.`
  return HOLIDAY_YEARS.some((value) => value === year) ? null : `${year}년 공휴일 정보는 아직 제공되지 않습니다.`
}

/** FullCalendar는 local 시간대이므로 UTC 변환으로 전날을 고르지 않는다. */
export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
