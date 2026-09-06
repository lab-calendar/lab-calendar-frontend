import { describe, expect, it } from 'vitest'
import { formatDDay } from './dDay'

describe('formatDDay', () => {
  it('마감이 남았으면 D- 로 표기한다', () => {
    expect(formatDDay(14)).toBe('D-14')
  })

  it('마감 당일은 D-DAY 로 표기한다', () => {
    expect(formatDDay(0)).toBe('D-DAY')
  })

  it('마감이 지났으면 D+ 로 표기한다', () => {
    expect(formatDDay(-3)).toBe('D+3')
  })
})
