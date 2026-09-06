import { describe, expect, it } from 'vitest'
import {
  toProjectInputFromForm,
  validateProjectForm,
  type ProjectFormValues,
} from './projectFormValidation'

function values(overrides: Partial<ProjectFormValues> = {}): ProjectFormValues {
  return {
    name: 'BRL 과제',
    submissionStage: '연차보고서',
    endDate: '2026-09-26',
    leadTimeWeeks: '3',
    active: true,
    ...overrides,
  }
}

describe('validateProjectForm', () => {
  it('올바른 값이면 오류가 없다', () => {
    expect(validateProjectForm(values())).toEqual({})
  })

  it('과제명이 공백뿐이면 오류를 낸다', () => {
    expect(validateProjectForm(values({ name: '   ' })).name).toBeDefined()
  })

  it('마감일이 비어 있으면 오류를 낸다', () => {
    expect(validateProjectForm(values({ endDate: '' })).endDate).toBeDefined()
  })

  it('준비 기간이 정수가 아니면 오류를 낸다', () => {
    expect(
      validateProjectForm(values({ leadTimeWeeks: '2.5' })).leadTimeWeeks,
    ).toBeDefined()
  })

  it('준비 기간이 0주 이하면 오류를 낸다', () => {
    expect(
      validateProjectForm(values({ leadTimeWeeks: '0' })).leadTimeWeeks,
    ).toBeDefined()
  })

  it('준비 기간이 26주를 넘으면 오류를 낸다', () => {
    expect(
      validateProjectForm(values({ leadTimeWeeks: '27' })).leadTimeWeeks,
    ).toBeDefined()
  })

  it('제출 단계는 비어 있어도 된다', () => {
    expect(validateProjectForm(values({ submissionStage: '' }))).toEqual({})
  })
})

describe('toProjectInputFromForm', () => {
  it('앞뒤 공백을 정리하고 준비 기간을 숫자로 바꾼다', () => {
    expect(
      toProjectInputFromForm(
        values({ name: '  BRL 과제 ', leadTimeWeeks: '4' }),
      ),
    ).toEqual({
      name: 'BRL 과제',
      submissionStage: '연차보고서',
      endDate: '2026-09-26',
      leadTimeWeeks: 4,
      active: true,
    })
  })

  it('제출 단계가 비면 undefined 로 보낸다', () => {
    expect(
      toProjectInputFromForm(values({ submissionStage: '  ' })).submissionStage,
    ).toBeUndefined()
  })
})
