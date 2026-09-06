import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../types/domain'
import { emptyNoteFor } from './calendarStatus'

const EVENT: CalendarEvent = {
  id: '1',
  title: '정기 주간 랩미팅',
  startDate: '2026-09-10',
  endDate: '2026-09-10',
  categoryKey: 'lab',
  participants: [],
  source: 'MANUAL',
}

describe('emptyNoteFor', () => {
  it('아직 못 받아온 동안에는 아무 말도 하지 않는다', () => {
    expect(emptyNoteFor(undefined, 0)).toBeNull()
  })

  it('보이는 일정이 있으면 아무 말도 하지 않는다', () => {
    expect(emptyNoteFor([EVENT], 1)).toBeNull()
  })

  it('이번 달 일정이 아예 없으면 등록을 안내한다', () => {
    expect(emptyNoteFor([], 0)).toBe('이번 달에 등록된 일정이 없습니다.')
  })

  it('일정은 있는데 필터에 다 가려졌으면 필터를 안내한다', () => {
    expect(emptyNoteFor([EVENT], 0)).toBe(
      '선택한 카테고리에 해당하는 일정이 없습니다.',
    )
  })
})
