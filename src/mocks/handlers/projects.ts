import { http } from 'msw'
import {
  dDayOf,
  isDeadlineImminent,
  mockDb,
  nextId,
  preparationStartOf,
  sortedProjects,
} from '../data/db'
import type { MockProject } from '../data/types'
import { fail, failIfScenario, guard, noContent, ok } from './respond'

/**
 * 연구 과제 (KAN-47, KAN-48, KAN-50).
 *
 * D-Day·준비 기간 시작일·마감 임박 여부는 **서버가 계산해서** 내려준다. 화면에서 다시
 * 세면 기기 시계가 틀어진 사람만 다른 날짜를 보게 되기 때문이다. 목도 같은 값을
 * 만들어 줘야 프론트가 계산을 되살리는 실수를 하지 않는다.
 */

type ProjectBody = {
  name?: unknown
  submissionStage?: unknown
  endDate?: unknown
  leadTimeDays?: unknown
  active?: unknown
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

function toResponse(project: MockProject) {
  return {
    id: project.id,
    name: project.name,
    submissionStage: project.submissionStage,
    endDate: project.endDate,
    leadTimeDays: project.leadTimeDays,
    active: project.active,
    dDay: dDayOf(project.endDate),
    deadlineImminent: isDeadlineImminent(project),
    preparationStartDate: preparationStartOf(project),
  }
}

function validate(body: ProjectBody): Record<string, string> {
  const errors: Record<string, string> = {}
  const name = text(body.name).trim()

  if (!name) errors.name = '과제명을 입력해 주세요.'
  else if (name.length > 200) errors.name = '과제명은 200자 이내로 입력해 주세요.'

  if (text(body.submissionStage).trim().length > 100) {
    errors.submissionStage = '제출 단계는 100자 이내로 입력해 주세요.'
  }

  if (!text(body.endDate)) errors.endDate = '제출 마감일을 선택해 주세요.'

  const leadTime = body.leadTimeDays
  if (typeof leadTime !== 'number' || !Number.isInteger(leadTime)) {
    errors.leadTimeDays = '준비 기간을 입력해 주세요.'
  } else if (leadTime < 0) {
    errors.leadTimeDays = '준비 기간은 0일 이상이어야 합니다.'
  } else if (leadTime > 182) {
    errors.leadTimeDays = '준비 기간은 182일 이하여야 합니다.'
  }

  if (typeof body.active !== 'boolean') {
    errors.active = '캘린더 표시 여부를 지정해 주세요.'
  }

  return errors
}

function applyBody(project: MockProject, body: ProjectBody): MockProject {
  const stage = text(body.submissionStage).trim()

  return {
    ...project,
    name: text(body.name).trim(),
    submissionStage: stage === '' ? null : stage,
    endDate: text(body.endDate),
    leadTimeDays: Number(body.leadTimeDays),
    active: Boolean(body.active),
  }
}

export const projectHandlers = [
  http.get('/api/projects', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('projects')
    if (failure) return failure

    return ok(sortedProjects().map(toResponse))
  }),

  http.post('/api/projects', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('projects')
    if (failure) return failure

    const body = (await request.json()) as ProjectBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    const created = applyBody(
      {
        id: nextId(),
        name: '',
        submissionStage: null,
        endDate: '',
        leadTimeDays: 21,
        active: true,
      },
      body,
    )

    // 등록만으로 캘린더에 준비 기간 막대가 나타난다 (기획서 3.1) — 막대는 파생이라
    // 따로 만들지 않아도 다음 일정 조회에 함께 온다.
    mockDb().projects.push(created)
    return ok(toResponse(created), 201)
  }),

  http.put('/api/projects/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('projects')
    if (failure) return failure

    const db = mockDb()
    const index = db.projects.findIndex((project) => project.id === String(params.id))
    if (index === -1) return fail('NOT_FOUND')

    const body = (await request.json()) as ProjectBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    const updated = applyBody(db.projects[index], body)
    db.projects[index] = updated
    return ok(toResponse(updated))
  }),

  http.delete('/api/projects/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('projects')
    if (failure) return failure

    const db = mockDb()
    const index = db.projects.findIndex((project) => project.id === String(params.id))
    if (index === -1) return fail('NOT_FOUND')

    // 과제를 지우면 그 과제의 준비 기간 막대도 함께 사라진다 (파생이라 저절로).
    db.projects.splice(index, 1)
    return noContent()
  }),
]
