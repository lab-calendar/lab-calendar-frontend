import { afterEach, describe, expect, it } from 'vitest'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { apiClient } from './client'
import { createEvent, fetchEvents, updateEvent } from './events'
import { createProject, fetchProjects, updateProject } from './projects'
import { fetchCategories } from './categories'

/**
 * 어댑터가 서버 DTO 와 도메인 타입 사이를 옮기는 방식 (KAN-71).
 *
 * 정렬·D-Day·준비 기간 계산은 전부 서버가 한다. 여기서 볼 것은 "무엇을 보내고 받은
 * 것을 어떻게 바꾸는가" 뿐이다.
 */

type Captured = { url?: string; method?: string; params?: unknown; body?: unknown }

const captured: Captured = {}

/** 서버 대신 정해진 본문을 돌려주고, 나간 요청을 기록한다. */
function respondWith(payload: unknown) {
  apiClient.defaults.adapter = (config: AxiosRequestConfig) => {
    captured.url = config.url
    captured.method = config.method
    captured.params = config.params
    captured.body = config.data ? JSON.parse(config.data as string) : undefined
    return Promise.resolve({
      data: payload,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse)
  }
}

afterEach(() => {
  apiClient.defaults.adapter = undefined
})

const EVENT_DTO = {
  id: '1',
  title: '정기 주간 랩미팅',
  detail: '홍길동',
  startDate: '2026-09-10',
  endDate: '2026-09-10',
  categoryKey: 'lab',
  memo: null,
  participants: ['홍길동', '김철수'],
  source: 'MANUAL',
}

const PROJECT_DTO = {
  id: '1',
  name: 'BRL 과제',
  submissionStage: null,
  endDate: '2026-09-26',
  leadTimeDays: 21,
  active: true,
  dDay: 6,
  preparationStartDate: '2026-09-05',
}

describe('fetchEvents', () => {
  it('조회 기간을 쿼리 파라미터로 보낸다', async () => {
    respondWith({ data: [] })

    await fetchEvents({ from: '2026-09-01', to: '2026-09-30' })

    expect(captured.url).toBe('/api/events')
    expect(captured.params).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('카테고리는 보내지 않는다', async () => {
    // 한 달치는 양이 적어 받아둔 목록을 화면에서 거르는 편이 빠르다 (KAN-43)
    respondWith({ data: [] })

    await fetchEvents({ from: '2026-09-01', to: '2026-09-30' })

    expect(captured.params).not.toHaveProperty('categories')
  })

  it('서버의 null 을 도메인의 없음으로 바꾼다', async () => {
    respondWith({ data: [EVENT_DTO] })

    const [event] = await fetchEvents({ from: '2026-09-01', to: '2026-09-30' })

    // null 과 undefined 가 섞이면 화면 곳곳에 `?? ''` 방어가 퍼진다
    expect(event.memo).toBeUndefined()
    expect(event.detail).toBe('홍길동')
    expect(event.participants).toEqual(['홍길동', '김철수'])
    expect(event.source).toBe('MANUAL')
  })

  it('서버가 내려준 자동 생성 일정을 그대로 받는다', async () => {
    // 준비 기간은 KAN-49 배치가 만든다. 프론트가 과제에서 파생시키지 않는다.
    respondWith({
      data: [{ ...EVENT_DTO, id: '2', categoryKey: 'project', source: 'AUTO_GENERATED' }],
    })

    const [event] = await fetchEvents({ from: '2026-09-01', to: '2026-09-30' })

    expect(event.source).toBe('AUTO_GENERATED')
  })
})

describe('createEvent / updateEvent', () => {
  it('값 없음을 null 로 보낸다', async () => {
    respondWith({ data: EVENT_DTO })

    await createEvent({
      title: '제목',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      categoryKey: 'lab',
      participants: [],
    })

    /*
     * 키를 빼면 JSON 에서 통째로 사라져 서버가 "비우기"와 "그대로 두기"를 구분하지
     * 못한다 — 메모를 지우려는 수정이 조용히 무시된다.
     */
    expect(captured.body).toMatchObject({ detail: null, memo: null })
  })

  it('서버가 정하는 값은 보내지 않는다', async () => {
    respondWith({ data: EVENT_DTO })

    await updateEvent('1', {
      title: '제목',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      categoryKey: 'lab',
      participants: [],
    })

    expect(captured.url).toBe('/api/events/1')
    expect(captured.body).not.toHaveProperty('id')
    expect(captured.body).not.toHaveProperty('source')
  })
})

describe('fetchProjects', () => {
  it('서버가 계산한 D-Day 와 준비 기간 시작일을 그대로 쓴다', async () => {
    respondWith({ data: [PROJECT_DTO] })

    const [project] = await fetchProjects()

    // 화면에서 다시 계산하면 기기 시계·타임존에 따라 사람마다 다른 값을 본다
    expect(project.dDay).toBe(6)
    expect(project.preparationStartDate).toBe('2026-09-05')
    expect(project.leadTimeDays).toBe(21)
  })

  it('제출 단계 없음을 undefined 로 바꾼다', async () => {
    respondWith({ data: [PROJECT_DTO] })

    const [project] = await fetchProjects()

    expect(project.submissionStage).toBeUndefined()
  })

  it('정렬을 다시 하지 않는다', async () => {
    // 활성 우선·마감 임박 순은 서버가 정한다 (계약 §7.1)
    respondWith({
      data: [
        { ...PROJECT_DTO, id: '1', endDate: '2026-12-31' },
        { ...PROJECT_DTO, id: '2', endDate: '2026-01-01' },
      ],
    })

    const projects = await fetchProjects()

    expect(projects.map((project) => project.id)).toEqual(['1', '2'])
  })
})

describe('createProject / updateProject', () => {
  it('준비 기간을 일 단위로 보낸다', async () => {
    respondWith({ data: PROJECT_DTO })

    await createProject({
      name: 'BRL 과제',
      endDate: '2026-09-26',
      leadTimeDays: 10,
      active: true,
    })

    expect(captured.url).toBe('/api/projects')
    expect(captured.body).toMatchObject({ leadTimeDays: 10 })
  })

  it('서버가 계산하는 값은 보내지 않는다', async () => {
    respondWith({ data: PROJECT_DTO })

    await updateProject('1', {
      name: 'BRL 과제',
      submissionStage: '연차보고서',
      endDate: '2026-09-26',
      leadTimeDays: 21,
      active: true,
    })

    expect(captured.url).toBe('/api/projects/1')
    expect(captured.body).not.toHaveProperty('dDay')
    expect(captured.body).not.toHaveProperty('preparationStartDate')
  })
})

describe('fetchCategories', () => {
  it('서버가 준 목록을 그대로 쓴다', async () => {
    respondWith({
      data: [
        { id: '1', key: 'project', name: '과제/연구 관리' },
        { id: '2', key: 'lab', name: '랩실 주기적 일정' },
      ],
    })

    const categories = await fetchCategories()

    expect(captured.url).toBe('/api/categories')
    expect(categories.map((category) => category.key)).toEqual(['project', 'lab'])
  })

  it('조회 등급에서 카드가 빠져도 프론트는 알 필요가 없다', async () => {
    // 거르는 자리는 서버다 (KAN-35). 여기서 등급을 보면 그 책임이 프론트로 옮겨 온다.
    respondWith({ data: [{ id: '1', key: 'project', name: '과제/연구 관리' }] })

    expect(await fetchCategories()).toHaveLength(1)
  })
})
