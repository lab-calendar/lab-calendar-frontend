import type { ProjectInput } from '../../types/domain'

/** 폼이 다루는 값. 입력 요소에 그대로 묶이므로 숫자도 문자열로 둔다. */
export type ProjectFormValues = {
  name: string
  submissionStage: string
  endDate: string
  leadTimeWeeks: string
  active: boolean
}

export type ProjectFormField = 'name' | 'endDate' | 'leadTimeWeeks'
export type ProjectFormErrors = Partial<Record<ProjectFormField, string>>

/** 기획서 3.1 의 기본 준비 기간. */
export const DEFAULT_LEAD_TIME_WEEKS = 3

const MIN_LEAD_TIME_WEEKS = 1
/** 준비 기간이 반년을 넘으면 캘린더가 그 막대 하나로 덮여 쓸모가 없어진다. */
const MAX_LEAD_TIME_WEEKS = 26

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

  const weeks = Number(values.leadTimeWeeks)
  if (!values.leadTimeWeeks.trim() || !Number.isInteger(weeks)) {
    errors.leadTimeWeeks = '준비 기간을 주 단위 정수로 입력해 주세요.'
  } else if (weeks < MIN_LEAD_TIME_WEEKS || weeks > MAX_LEAD_TIME_WEEKS) {
    errors.leadTimeWeeks = `준비 기간은 ${MIN_LEAD_TIME_WEEKS}주 이상 ${MAX_LEAD_TIME_WEEKS}주 이하여야 합니다.`
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
    leadTimeWeeks: Number(values.leadTimeWeeks),
    active: values.active,
  }
}
