import { beforeEach, describe, expect, it } from 'vitest'
import { addDays, todayIso } from '../utils/date'
import { eventRecords, projectRecords } from './dummyDb'
import { fetchEvents } from './events'
import {
  createProject,
  deleteProject,
  fetchProjects,
  toProjectInput,
  updateProject,
} from './projects'

const projectSeed = [...projectRecords]
const eventSeed = [...eventRecords]

beforeEach(() => {
  projectRecords.splice(0, projectRecords.length, ...projectSeed)
  eventRecords.splice(0, eventRecords.length, ...eventSeed)
})

/** 앞뒤로 넉넉히 잡은 조회 기간. 파생된 준비 기간이 어디에 걸리든 포함된다. */
const WIDE_RANGE = {
  from: addDays(todayIso(), -400),
  to: addDays(todayIso(), 400),
}

describe('fetchProjects', () => {
  it('마감이 이른 순으로 내려주고 비활성 과제는 뒤로 보낸다', async () => {
    const projects = await fetchProjects()

    expect(projects.map((project) => project.active)).toEqual([
      true,
      true,
      false,
    ])
    expect(projects[0].endDate <= projects[1].endDate).toBe(true)
  })

  it('준비 기간 시작일을 마감일에서 리드타임만큼 앞당겨 계산한다', async () => {
    const [project] = await fetchProjects()

    expect(project.preparationStartDate).toBe(
      addDays(project.endDate, -project.leadTimeWeeks * 7),
    )
  })

  it('D-Day 를 오늘 기준으로 함께 내려준다', async () => {
    const created = await createProject({
      name: '테스트 과제',
      endDate: addDays(todayIso(), 10),
      leadTimeWeeks: 3,
      active: true,
    })

    expect(created.dDay).toBe(10)
  })
})

describe('과제와 캘린더 준비 기간 일정', () => {
  it('과제를 등록하면 준비 기간 일정이 캘린더에 생긴다', async () => {
    const created = await createProject({
      name: '신규 과제',
      submissionStage: '착수보고서',
      endDate: addDays(todayIso(), 30),
      leadTimeWeeks: 2,
      active: true,
    })

    const events = await fetchEvents(WIDE_RANGE)
    const generated = events.find((event) => event.title === '신규 과제')

    expect(generated).toMatchObject({
      detail: '착수보고서',
      startDate: created.preparationStartDate,
      endDate: created.endDate,
      categoryKey: 'project',
      source: 'AUTO_GENERATED',
    })
  })

  it('리드타임을 늘리면 준비 기간 일정이 함께 길어진다', async () => {
    const created = await createProject({
      name: '기간 조정 과제',
      endDate: addDays(todayIso(), 30),
      leadTimeWeeks: 2,
      active: true,
    })

    await updateProject(created.id, {
      ...toProjectInput(created),
      leadTimeWeeks: 5,
    })

    const events = await fetchEvents(WIDE_RANGE)
    const generated = events.find((event) => event.title === '기간 조정 과제')

    expect(generated?.startDate).toBe(addDays(created.endDate, -35))
  })

  it('비활성 과제의 준비 기간 일정은 캘린더에서 빠진다', async () => {
    const created = await createProject({
      name: '숨길 과제',
      endDate: addDays(todayIso(), 30),
      leadTimeWeeks: 2,
      active: true,
    })

    await updateProject(created.id, {
      ...toProjectInput(created),
      active: false,
    })

    const events = await fetchEvents(WIDE_RANGE)
    expect(events.some((event) => event.title === '숨길 과제')).toBe(false)
  })

  it('과제를 지우면 준비 기간 일정도 사라진다', async () => {
    const created = await createProject({
      name: '지울 과제',
      endDate: addDays(todayIso(), 30),
      leadTimeWeeks: 2,
      active: true,
    })

    await deleteProject(created.id)

    const events = await fetchEvents(WIDE_RANGE)
    expect(events.some((event) => event.title === '지울 과제')).toBe(false)
  })

  it('없는 과제를 지우면 NOT_FOUND 를 던진다', async () => {
    await expect(deleteProject('없는-id')).rejects.toMatchObject({
      kind: 'NOT_FOUND',
    })
  })
})
