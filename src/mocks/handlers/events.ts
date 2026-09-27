import { http } from 'msw'
import { isCategoryKey } from '../../constants/categories'
import { overlaps } from '../../utils/date'
import { allEvents, currentTier, mockDb, nextId } from '../data/db'
import type { MockEvent } from '../data/types'
import { fail, failIfScenario, guard, noContent, ok } from './respond'

/**
 * 일정 (KAN-39, KAN-40).
 *
 * 조회는 손으로 넣은 일정과 과제에서 파생된 준비 기간 막대를 함께 내려준다. 프론트는
 * 둘을 구분하지 않고 받은 그대로 그린다 — 구분은 `source` 가 한다.
 */

type EventBody = {
  title?: unknown
  detail?: unknown
  startDate?: unknown
  endDate?: unknown
  categoryKey?: unknown
  memo?: unknown
  participants?: unknown
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

/** 빈 문자열과 공백뿐인 값은 "없음" 이라 null 로 저장한다. */
const blankToNull = (value: unknown): string | null => {
  const trimmed = text(value).trim()
  return trimmed === '' ? null : trimmed
}

/**
 * 참석자 이름 정리: 공백을 떼고, 빈 것을 버리고, 중복을 없애고, 순서는 지킨다.
 *
 * 중복 제거는 실제 서버가 하는 일이다(계약 §2.1). 목이 이것을 빼먹으면 화면의
 * "총 N명" 이 목에서만 다르게 보인다.
 */
function normalizeParticipants(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const names = value
    .filter((name): name is string => typeof name === 'string')
    .map((name) => name.trim())
    .filter(Boolean)

  return [...new Set(names)]
}

function validate(body: EventBody): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = text(body.title).trim()
  const startDate = text(body.startDate)
  const endDate = text(body.endDate)

  if (!title) errors.title = '제목을 입력해 주세요.'
  else if (title.length > 500) errors.title = '제목은 500자 이내로 입력해 주세요.'

  if (!startDate) errors.startDate = '시작일을 선택해 주세요.'
  if (!endDate) errors.endDate = '종료일을 선택해 주세요.'
  else if (startDate && endDate < startDate) {
    errors.endDate = '종료일은 시작일보다 빠를 수 없습니다.'
  }

  if (!text(body.categoryKey)) errors.categoryKey = '항목 유형을 선택해 주세요.'
  else if (!isCategoryKey(text(body.categoryKey))) {
    errors.categoryKey = '항목 유형을 선택해 주세요.'
  }

  return errors
}

function applyBody(event: MockEvent, body: EventBody): MockEvent {
  const categoryKey = text(body.categoryKey)

  return {
    ...event,
    title: text(body.title).trim(),
    detail: blankToNull(body.detail),
    startDate: text(body.startDate),
    endDate: text(body.endDate),
    categoryKey: isCategoryKey(categoryKey) ? categoryKey : event.categoryKey,
    memo: blankToNull(body.memo),
    participants: normalizeParticipants(body.participants),
  }
}

export const eventHandlers = [
  http.get('/api/events', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('events')
    if (failure) return failure

    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? ''
    const to = url.searchParams.get('to') ?? ''

    if (!from || !to) {
      return fail('VALIDATION_FAILED', {
        [from ? 'to' : 'from']: '조회 기간을 지정해 주세요.',
      })
    }

    const events = allEvents()
      // 양끝을 포함하는 기간이다 (계약 §6.4)
      .filter((event) => overlaps(event, { from, to }))
      // 조회 등급에는 카드 지출이 아예 오지 않는다 (KAN-35)
      .filter((event) => currentTier() !== 'VIEWER' || event.categoryKey !== 'card')
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id))

    return ok(events)
  }),

  http.post('/api/events', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('events')
    if (failure) return failure

    const body = (await request.json()) as EventBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    const created = applyBody(
      {
        id: nextId(),
        title: '',
        detail: null,
        startDate: '',
        endDate: '',
        categoryKey: 'project',
        memo: null,
        participants: [],
        source: 'MANUAL',
      },
      body,
    )

    mockDb().events.push(created)
    return ok(created, 201)
  }),

  http.put('/api/events/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('events')
    if (failure) return failure

    const id = String(params.id)
    const db = mockDb()
    const index = db.events.findIndex((event) => event.id === id)

    /*
     * 파생된 준비 기간 막대와 엑셀에서 들여온 카드 지출은 서버가 다시 만들어 덮어쓴다.
     * 고치려 들면 실제 서버가 거절하므로, 목도 같은 자리에서 막는다.
     */
    if (index === -1) {
      const derived = allEvents().some((event) => event.id === id)
      return fail(derived ? 'FORBIDDEN' : 'NOT_FOUND')
    }

    const body = (await request.json()) as EventBody
    const errors = validate(body)
    if (Object.keys(errors).length > 0) return fail('VALIDATION_FAILED', errors)

    const updated = applyBody(db.events[index], body)
    db.events[index] = updated
    return ok(updated)
  }),

  http.delete('/api/events/:id', async ({ request, params }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('events')
    if (failure) return failure

    const id = String(params.id)
    const db = mockDb()
    const index = db.events.findIndex((event) => event.id === id)

    if (index === -1) {
      const derived = allEvents().some((event) => event.id === id)
      return fail(derived ? 'FORBIDDEN' : 'NOT_FOUND')
    }

    db.events.splice(index, 1)
    return noContent()
  }),
]
