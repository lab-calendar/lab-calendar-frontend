import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HolidayDayNumber from './HolidayDayNumber'

describe('공휴일 날짜 표시', () => {
  it('같은 날짜의 여러 공휴일 이름을 모두 제공한다', () => {
    render(<HolidayDayNumber dayNumberText="5일" holidayNames={['어린이날', '부처님오신날']} />)
    expect(screen.getByText('어린이날 · 부처님오신날')).toHaveAttribute('title', '어린이날 · 부처님오신날')
    expect(screen.getByText('5일')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
