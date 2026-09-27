import { afterEach, describe, expect, it } from 'vitest'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { apiClient } from './client'
import {
  activeMembers,
  createMember,
  deleteMember,
  fetchMembers,
  updateMember,
} from './members'
import type { Member } from '../types/domain'

/** 구성원 어댑터가 서버와 주고받는 모양 (KAN-74). */

type Captured = { url?: string; method?: string; body?: unknown }

const captured: Captured = {}

function respondWith(payload: unknown) {
  apiClient.defaults.adapter = (config: AxiosRequestConfig) => {
    captured.url = config.url
    captured.method = config.method
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

const DTO = { id: 'm1', name: '홍길동', active: true }

describe('fetchMembers', () => {
  it('명단을 서버 순서 그대로 돌려준다', async () => {
    // 재직 중인 사람 먼저, 그 안에서 이름순 — 화면에서 다시 정렬하지 않는다
    respondWith({ data: [DTO, { id: 'm2', name: '김철수', active: false }] })

    const members = await fetchMembers()

    expect(captured.url).toBe('/api/members')
    expect(members.map((member) => member.id)).toEqual(['m1', 'm2'])
    expect(members[1].active).toBe(false)
  })
})

describe('createMember / updateMember', () => {
  it('이름과 재직 여부만 보낸다', async () => {
    respondWith({ data: DTO })

    await createMember({ name: '홍길동', active: true })

    expect(captured.method).toBe('post')
    expect(captured.url).toBe('/api/members')
    expect(captured.body).toEqual({ name: '홍길동', active: true })
  })

  it('수정은 id 를 경로에 붙인다', async () => {
    respondWith({ data: { ...DTO, active: false } })

    const member = await updateMember('m1', { name: '홍길동', active: false })

    expect(captured.method).toBe('put')
    expect(captured.url).toBe('/api/members/m1')
    expect(member.active).toBe(false)
  })
})

describe('deleteMember', () => {
  it('id 로 지운다', async () => {
    respondWith({})

    await deleteMember('m1')

    expect(captured.method).toBe('delete')
    expect(captured.url).toBe('/api/members/m1')
  })
})

describe('activeMembers', () => {
  const roster: Member[] = [
    { id: 'm1', name: '홍길동', active: true },
    { id: 'm2', name: '김철수', active: false },
  ]

  it('떠난 사람은 고르는 자리에 올리지 않는다', () => {
    expect(activeMembers(roster).map((member) => member.name)).toEqual([
      '홍길동',
    ])
  })

  it('아직 명단을 못 받았으면 빈 목록이다', () => {
    // 명단은 거들기만 한다. 못 받아도 폼은 그대로 동작해야 한다.
    expect(activeMembers(undefined)).toEqual([])
  })
})
