import type { ProjectInput } from '../../types/domain'

/** 폼이 다루는 값. 입력 요소에 그대로 묶이므로 숫자도 문자열로 둔다. */
export type ProjectFormValues = {
  name: string
  submissionStage: string
  endDate: string
  leadTimeDays: string
  active: boolean
}

export type ProjectFormField = 'name' | 'endDate' | 'leadTimeDays'
export type ProjectFormErrors = Partial<Record<ProjectFormField, string>>

/** 기획서 3.1 의 기본 준비 기간 — 3주. */
export const DEFAULT_LEAD_TIME_DAYS = 21

/**
 * 준비 기간의 범위 (docs/api-contract.md §7.4).
 *
 * 주 단위가 아니라 일 단위로 받는다. "열흘 준비" 처럼 주로 떨어지지 않는 기간이
 * 실제로 있고, 주로만 받으면 그런 과제를 등록할 방법이 없다.
 *
 * 0 은 마감 당일 하루짜리를 뜻한다. 상한을 반년으로 둔 이유는, 그보다 긴 준비 기간은
 * 캘린더가 그 막대 하나로 덮여 나머지 일정을 읽을 수 없게 되기 때문이다.
 */
const MIN_LEAD_TIME_DAYS = 0
const MAX_LEAD_TIME_DAYS = 182

export function validateProjectForm(
  values: ProjectFormValues,
): ProjectFormErrors {
  const errors: ProjectFormErrors = {}

  if (!values.name.trim()) {
    errors.name = '과제명을 입력해 주세요.'
  }

  if (!values.endDate) {
    errors.endDate = '제출 마감일을 선택해 주세요.'
  }

  const days = Number(values.leadTimeDays)
  if (!values.leadTimeDays.trim() || !Number.isInteger(days)) {
    errors.leadTimeDays = '준비 기간을 일 단위 정수로 입력해 주세요.'
  } else if (days < MIN_LEAD_TIME_DAYS || days > MAX_LEAD_TIME_DAYS) {
    errors.leadTimeDays = `준비 기간은 ${MIN_LEAD_TIME_DAYS}일 이상 ${MAX_LEAD_TIME_DAYS}일 이하여야 합니다.`
  }

  return errors
}

/** 검증을 통과한 폼 값을 API 입력값으로 바꾼다. */
export function toProjectInputFromForm(
  values: ProjectFormValues,
): ProjectInput {
  const submissionStage = values.submissionStage.trim()

  return {
    name: values.name.trim(),
    submissionStage: submissionStage || undefined,
    endDate: values.endDate,
    leadTimeDays: Number(values.leadTimeDays),
    active: values.active,
  }
}
