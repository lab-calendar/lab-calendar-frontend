import { http } from 'msw'
import { isMemberReferenced, mockDb, nextId, sortedMembers } from '../data/db'
import type { MockMember } from '../data/types'
import { fail, failIfScenario, guard, noContent, ok } from './respond'

/**
 * 랩실 구성원 (KAN-41, 연동은 KAN-74).
 *
 * 로그인 계정이 아니라 이름 명단이다. 일정에 한 번이라도 쓰인 사람은 지워지지 않고
 * 409 로 거절된다 — 지우면 지난 일정에서 그 사람이 사라지기 때문이다.
 */

type MemberBody = { name?: unknown; active?: unknown }

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

function validate(body: MemberBody): Record<string, string> {
  const errors: Record<string, string> = {}
  const name = text(body.name).trim()

  if (!name) errors.name = '이름을 입력해 주세요.'
  else if (name.length > 100) errors.name = '이름은 100자 이내로 입력해 주세요.'

  if (typeof body.active !== 'boolean') {
    errors.active = '재직 여부를 지정해 주세요.'
  }

  return errors
}

function applyBody(member: MockMember, body: MemberBody): MockMember {
  return {
    ...member,
    name: text(body.name).trim(),
    active: Boolean(body.active),
  }
}

export const memberHandlers = [
  http.get('/api/members', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('members')
    if (failure) return failure

    // 떠난 사람도 함께 내려준다. 고르는 자리에서 거르는 것은 화면의 몫이다.
    return ok(sortedMembers())
  }),

  http.post('/api/members', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('members')
    if (failure) return failure

    const body = (await request.json()) as MemberBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    // 같은 이름을 막지 않는다 — 동명이인은 실제로 있고, 가르는 것은 id 다.
    const created = applyBody({ id: nextId(), name: '', active: true }, body)
    mockDb().members.push(created)
    return ok(created, 201)
  }),

  http.put('/api/members/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('members')
    if (failure) return failure

    const db = mockDb()
    const index = db.members.findIndex((member) => member.id === String(params.id))
    if (index === -1) return fail('NOT_FOUND')

    const body = (await request.json()) as MemberBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    const updated = applyBody(db.members[index], body)
    db.members[index] = updated
    return ok(updated)
  }),

  http.delete('/api/members/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('members')
    if (failure) return failure

    const db = mockDb()
    const index = db.members.findIndex((member) => member.id === String(params.id))
    if (index === -1) return fail('NOT_FOUND')

    // 일정에 이름이 남아 있으면 지우지 못한다. 재직 여부를 끄는 것이 남은 길이다.
    if (isMemberReferenced(db.members[index].name)) return fail('CONFLICT')

    db.members.splice(index, 1)
    return noContent()
  }),
]
