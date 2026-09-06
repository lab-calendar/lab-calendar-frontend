import { describe, expect, it } from 'vitest'
import {
  parseParticipants,
  validateEventForm,
  type EventFormValues,
} from './eventFormValidation'

function values(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    categoryKey: 'lab',
    title: '정기 주간 랩미팅',
    detail: '',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    participants: '',
    memo: '',
    ...overrides,
  }
}

describe('validateEventForm', () => {
  it('올바른 값이면 오류가 없다', () => {
    expect(validateEventForm(values())).toEqual({})
  })

  it('제목이 비면 오류를 낸다', () => {
    expect(validateEventForm(values({ title: '   ' })).title).toBe(
      '제목을 입력해 주세요.',
    )
  })

  it('시작일이 비면 오류를 낸다', () => {
    expect(validateEventForm(values({ startDate: '' })).startDate).toBe(
      '시작일을 선택해 주세요.',
    )
  })

  it('종료일이 비면 오류를 낸다', () => {
    expect(validateEventForm(values({ endDate: '' })).endDate).toBe(
      '종료일을 선택해 주세요.',
    )
  })

  it('종료일이 시작일보다 빠르면 오류를 낸다', () => {
    const errors = validateEventForm(
      values({ startDate: '2026-09-10', endDate: '2026-09-09' }),
    )

    expect(errors.endDate).toBe('종료일은 시작일보다 빠를 수 없습니다.')
  })

  it('같은 날은 허용한다', () => {
    const errors = validateEventForm(
      values({ startDate: '2026-09-10', endDate: '2026-09-10' }),
    )

    expect(errors.endDate).toBeUndefined()
  })

  it('시작일이 비어 있으면 종료일 비교는 하지 않는다', () => {
    const errors = validateEventForm(
      values({ startDate: '', endDate: '2026-09-09' }),
    )

    expect(errors.endDate).toBeUndefined()
    expect(errors.startDate).toBeDefined()
  })
})

describe('parseParticipants', () => {
  it('쉼표로 나누고 공백을 정리한다', () => {
    expect(parseParticipants(' 홍길동 , 김철수 ')).toEqual(['홍길동', '김철수'])
  })

  it('빈 항목을 버린다', () => {
    expect(parseParticipants('홍길동,,김철수,')).toEqual(['홍길동', '김철수'])
  })

  it('중복을 제거한다', () => {
    expect(parseParticipants('홍길동, 김철수, 홍길동')).toEqual([
      '홍길동',
      '김철수',
    ])
  })

  it('비어 있으면 빈 배열을 준다', () => {
    expect(parseParticipants('   ')).toEqual([])
  })
})
