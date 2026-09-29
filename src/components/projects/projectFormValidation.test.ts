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
    leadTimeDays: '21',
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
      validateProjectForm(values({ leadTimeDays: '2.5' })).leadTimeDays,
    ).toBeDefined()
  })

  it('준비 기간 0일은 마감 당일 하루를 뜻하므로 허용한다', () => {
    expect(
      validateProjectForm(values({ leadTimeDays: '0' })).leadTimeDays,
    ).toBeUndefined()
  })

  it('준비 기간이 음수면 오류를 낸다', () => {
    expect(
      validateProjectForm(values({ leadTimeDays: '-1' })).leadTimeDays,
    ).toBeDefined()
  })

  it('계약 상한인 182일까지는 허용하고 그 위는 막는다', () => {
    // 준비 기간이 반년을 넘으면 캘린더가 그 막대 하나로 덤여 나머지를 읽을 수 없다
    expect(
      validateProjectForm(values({ leadTimeDays: '182' })).leadTimeDays,
    ).toBeUndefined()
    expect(
      validateProjectForm(values({ leadTimeDays: '183' })).leadTimeDays,
    ).toBeDefined()
  })

  it('주로 떨어지지 않는 기간도 넣을 수 있다', () => {
    // 주 단위로 받았다면 "열흘 준비" 를 등록할 방법이 없다
    expect(
      validateProjectForm(values({ leadTimeDays: '10' })).leadTimeDays,
    ).toBeUndefined()
  })

  it('제출 단계는 비어 있어도 된다', () => {
    expect(validateProjectForm(values({ submissionStage: '' }))).toEqual({})
  })
})

describe('toProjectInputFromForm', () => {
  it('앞뒤 공백을 정리하고 준비 기간을 숫자로 바꾼다', () => {
    expect(
      toProjectInputFromForm(
        values({ name: '  BRL 과제 ', leadTimeDays: '4' }),
      ),
    ).toEqual({
      name: 'BRL 과제',
      submissionStage: '연차보고서',
      endDate: '2026-09-26',
      leadTimeDays: 4,
      active: true,
    })
  })

  it('제출 단계가 비면 undefined 로 보낸다', () => {
    expect(
      toProjectInputFromForm(values({ submissionStage: '  ' })).submissionStage,
    ).toBeUndefined()
  })
})
