import KoreanLunarCalendar from 'korean-lunar-calendar'

export type PublicHoliday = { date: string; name: string }
export const LAST_LUNAR_YEAR = 2050

function key(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function shift(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return key(value)
}

function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

/** 현행 규칙의 예상 목록. 임시공휴일과 미래 선거일은 추측하지 않는다. */
export function projectedHolidays(year: number): PublicHoliday[] {
  if (!Number.isInteger(year) || year < 2026 || year > 9999) return []
  const groups: { dates: string[]; name: string; substitute: 'weekend' | 'sunday' | 'none' }[] = []
  const fixed = (month: number, day: number, name: string, substitute: 'weekend' | 'none' = 'weekend') => {
    groups.push({ dates: [`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`], name, substitute })
  }
  fixed(1, 1, '신정', 'none')
  fixed(3, 1, '삼일절')
  fixed(5, 1, '노동절')
  fixed(5, 5, '어린이날')
  fixed(6, 6, '현충일', 'none')
  fixed(7, 17, '제헌절')
  fixed(8, 15, '광복절')
  fixed(10, 3, '개천절')
  fixed(10, 9, '한글날')
  fixed(12, 25, '기독탄신일')

  if (year <= LAST_LUNAR_YEAR) {
    const lunar = new KoreanLunarCalendar()
    for (const [month, day, name, festival] of [
      [1, 1, '설날', true], [4, 8, '부처님오신날', false], [8, 15, '추석', true],
    ] as const) {
      if (!lunar.setLunarDate(year, month, day, false)) throw new Error(`음력 변환 실패: ${year}-${month}-${day}`)
      const solar = lunar.getSolarCalendar()
      const center = key(new Date(Date.UTC(solar.year, solar.month - 1, solar.day)))
      groups.push({ dates: festival ? [shift(center, -1), center, shift(center, 1)] : [center], name, substitute: festival ? 'sunday' : 'weekend' })
    }
  }

  const result: PublicHoliday[] = groups.flatMap(({ dates, name }) => dates.map((date) => ({ date, name })))
  const occupied = new Set(result.map(({ date }) => date))
  // 같은 날 겹친 두 명칭은 한 번의 대체휴일로 합친다 (어린이날·부처님오신날).
  const requests = new Map<string, { names: string[]; last: string }>()
  for (const group of groups) {
    if (group.substitute === 'none') continue
    const qualifyingDate = group.dates.find((date) => {
      const day = weekday(date)
      return day === 0 || (day === 6 && group.substitute === 'weekend') ||
        (day !== 0 && day !== 6 && groups.some((other) => other !== group && other.dates.includes(date)))
    })
    if (!qualifyingDate) continue
    const last = group.dates[group.dates.length - 1]
    // 겹친 실제 날짜로 합친다. 추석은 연휴 끝까지 건너뛰어야 하지만,
    // 같은 날 겹친 개천절과 별개의 대체휴일을 만들면 안 된다.
    const request = requests.get(qualifyingDate) ?? { names: [], last }
    request.names.push(group.name)
    if (last > request.last) request.last = last
    requests.set(qualifyingDate, request)
  }
  for (const { last, names } of [...requests.values()].sort((a, b) => a.last.localeCompare(b.last))) {
    let date = shift(last, 1)
    while (weekday(date) === 0 || weekday(date) === 6 || occupied.has(date)) date = shift(date, 1)
    result.push({ date, name: `대체공휴일(${names.join('·')})` })
    occupied.add(date)
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
