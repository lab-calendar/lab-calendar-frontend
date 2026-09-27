import type { CategoryKey } from '../../constants/categories'

/** 폼이 다루는 값. 입력 요소에 그대로 묶이므로 전부 문자열이다. */
export type EventFormValues = {
  categoryKey: CategoryKey
  title: string
  detail: string
  startDate: string
  endDate: string
  /** 쉼표로 구분한 이름 목록 */
  participants: string
  memo: string
}

export type EventFormField = 'title' | 'startDate' | 'endDate'
export type EventFormErrors = Partial<Record<EventFormField, string>>

export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {}

  if (!values.title.trim()) {
    errors.title = '제목을 입력해 주세요.'
  }

  if (!values.startDate) {
    errors.startDate = '시작일을 선택해 주세요.'
  }

  if (!values.endDate) {
    errors.endDate = '종료일을 선택해 주세요.'
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = '종료일은 시작일보다 빠를 수 없습니다.'
  }

  return errors
}

/**
 * 참석자 입력에서 이름 하나를 넣거나 뺀다 (KAN-74 명단에서 고르기).
 *
 * 입력칸의 글을 받아 새 글을 돌려준다 — 고른 사람을 따로 들고 있으면 손으로 지운
 * 이름이 어딘가에 선택된 채 남아 두 곳이 어긋난다.
 */
export function toggleParticipantName(input: string, name: string): string {
  const names = parseParticipants(input)
  const next = names.includes(name)
    ? names.filter((selected) => selected !== name)
    : [...names, name]

  return next.join(', ')
}

/** 쉼표로 구분한 입력을 이름 배열로 바꾼다. 공백과 중복은 정리한다. */
export function parseParticipants(input: string): string[] {
  const names = input
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return [...new Set(names)]
}
