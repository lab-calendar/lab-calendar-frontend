import { describe, expect, it } from 'vitest'
import {
  toMemberInputFromForm,
  validateMemberForm,
} from './memberFormValidation'

describe('validateMemberForm', () => {
  it('이름이 비면 막는다', () => {
    expect(validateMemberForm({ name: '', active: true }).name).toBe(
      '이름을 입력해 주세요.',
    )
    expect(validateMemberForm({ name: '   ', active: true }).name).toBe(
      '이름을 입력해 주세요.',
    )
  })

  it('서버 길이 제한을 넘기면 막는다', () => {
    const errors = validateMemberForm({ name: 'ㄱ'.repeat(101), active: true })

    expect(errors.name).toBe('이름은 100자 이내로 입력해 주세요.')
    expect(validateMemberForm({ name: 'ㄱ'.repeat(100), active: true })).toEqual(
      {},
    )
  })

  it('이름이 있으면 통과한다', () => {
    expect(validateMemberForm({ name: '홍길동', active: false })).toEqual({})
  })
})

describe('toMemberInputFromForm', () => {
  it('앞뒤 공백을 떼고 보낸다', () => {
    expect(toMemberInputFromForm({ name: '  홍길동 ', active: true })).toEqual({
      name: '홍길동',
      active: true,
    })
  })
})
