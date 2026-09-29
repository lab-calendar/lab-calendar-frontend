import type { MemberInput } from '../../types/domain'

/** 폼이 다루는 값. 입력 요소에 그대로 묶인다. */
export type MemberFormValues = {
  name: string
  active: boolean
}

export type MemberFormField = 'name'
export type MemberFormErrors = Partial<Record<MemberFormField, string>>

/** 서버의 이름 길이 제한 (`MemberRequest`). */
const MAX_NAME_LENGTH = 100

/**
 * 같은 이름을 막지 않는다.
 *
 * 동명이인은 실제로 있고, 서버도 이름을 유일하게 보지 않는다(계약 §2.1). 두 사람을
 * 가르는 것은 이름이 아니라 id 다.
 */
export function validateMemberForm(values: MemberFormValues): MemberFormErrors {
  const errors: MemberFormErrors = {}
  const name = values.name.trim()

  if (!name) {
    errors.name = '이름을 입력해 주세요.'
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `이름은 ${MAX_NAME_LENGTH}자 이내로 입력해 주세요.`
  }

  return errors
}

/** 검증을 통과한 폼 값을 API 입력값으로 바꾼다. */
export function toMemberInputFromForm(values: MemberFormValues): MemberInput {
  return {
    name: values.name.trim(),
    active: values.active,
  }
}
