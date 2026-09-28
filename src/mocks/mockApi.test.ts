import { describe, expect, it } from 'vitest'
import { login, logout } from '../api/auth'
import { fetchCategories } from '../api/categories'
import { ApiError } from '../api/errors'
import { createEvent, fetchEvents } from '../api/events'
import { deleteMember, fetchMembers } from '../api/members'
import { fetchProjects, updateProject } from '../api/projects'
import { setUpMockApi } from '../test/mockApi'
import { setFailing } from './scenario'

/**
 * 목 서버가 실제 서버처럼 구는지 (KAN-70).
 *
 * 어댑터를 통해 부른다. 목이 지켜야 하는 것은 "그럴듯한 데이터" 가 아니라 **계약**이다 —
 * 응답 래퍼, 에러 형태, 서버가 계산해 주는 값, 등급별 필터. 이것들이 어긋나면 목으로
 * 만든 화면이 실제 API 앞에서 무너진다.
 */

const TODAY = '2026-09-27'

setUpMockApi({ today: TODAY })

/** 목의 개발용 비밀번호. 실제 비밀번호는 서버 환경변수에만 있다. */
async function signInAs(tier: 'editor' | 'viewer') {
  return login(tier)
}

describe('인증', () => {
  it('비밀번호가 등급을 정한다', async () => {
    expect(await signInAs('editor')).toEqual({
      authenticated: true,
      tier: 'EDITOR',
    })

    await logout()

    expect(await signInAs('viewer')).toEqual({
      authenticated: true,
      tier: 'VIEWER',
    })
  })

  it('틀린 비밀번호는 401 로 돌아온다', async () => {
    await expect(login('없는비밀번호')).rejects.toMatchObject({
      kind: 'UNAUTHORIZED',
    })
  })

  it('로그인하지 않으면 다른 요청이 막힌다', async () => {
    // 프론트의 401 리스너가 이 응답을 보고 비밀번호 화면으로 돌려보낸다
    await expect(fetchProjects()).rejects.toMatchObject({ kind: 'UNAUTHORIZED' })
  })
})

describe('일정', () => {
  it('과제에서 파생된 준비 기간 막대가 함께 온다', async () => {
    await signInAs('editor')

    const events = await fetchEvents({ from: '2026-09-01', to: '2026-10-31' })
    const generated = events.filter((event) => event.source === 'AUTO_GENERATED')

    expect(generated.length).toBeGreaterThan(0)
    // 막대는 마감일에서 리드타임만큼 거슬러 올라간 날 시작한다
    const brl = generated.find((event) => event.title === 'BRL 과제')
    expect(brl).toMatchObject({ startDate: '2026-09-10', endDate: '2026-10-01' })
  })

  it('기간 밖의 일정은 오지 않는다', async () => {
    await signInAs('editor')

    const events = await fetchEvents({ from: TODAY, to: TODAY })

    expect(events.every((event) => event.startDate <= TODAY)).toBe(true)
    expect(events.every((event) => event.endDate >= TODAY)).toBe(true)
  })

  it('조회 등급에는 카드 지출이 아예 오지 않는다', async () => {
    await signInAs('viewer')

    const events = await fetchEvents({ from: '2026-09-01', to: '2026-10-31' })
    const categories = await fetchCategories()

    expect(events.some((event) => event.categoryKey === 'card')).toBe(false)
    expect(categories.some((category) => category.key === 'card')).toBe(false)
  })

  it('조회 등급은 일정을 만들 수 없다', async () => {
    await signInAs('viewer')

    await expect(
      createEvent({
        title: '몰래 넣기',
        startDate: TODAY,
        endDate: TODAY,
        categoryKey: 'lab',
        participants: [],
      }),
    ).rejects.toMatchObject({ kind: 'FORBIDDEN' })
  })

  it('등록한 일정이 다음 조회에 나타나고, 참석자 중복은 서버가 정리한다', async () => {
    await signInAs('editor')

    const created = await createEvent({
      title: '세미나',
      startDate: TODAY,
      endDate: TODAY,
      categoryKey: 'lab',
      participants: ['홍길동', ' 홍길동 ', '김철수'],
    })

    expect(created.participants).toEqual(['홍길동', '김철수'])

    const events = await fetchEvents({ from: TODAY, to: TODAY })
    expect(events.map((event) => event.id)).toContain(created.id)
  })

  it('제목이 비면 400 과 함께 어느 칸이 문제인지 알려 준다', async () => {
    await signInAs('editor')

    await expect(
      createEvent({
        title: '  ',
        startDate: TODAY,
        endDate: TODAY,
        categoryKey: 'lab',
        participants: [],
      }),
    ).rejects.toMatchObject({
      kind: 'VALIDATION',
      fieldErrors: { title: '제목을 입력해 주세요.' },
    })
  })
})

describe('과제', () => {
  it('서버가 계산한 값과 순서로 온다', async () => {
    await signInAs('editor')

    const projects = await fetchProjects()

    // 활성 과제가 먼저, 그 안에서 마감이 가까운 순
    expect(projects.map((project) => project.name)).toEqual([
      '인공지능 과제',
      'BRL 과제',
      '창의도전 과제',
      '산학협력 과제',
      '소재융합 과제',
    ])

    const brl = projects.find((project) => project.name === 'BRL 과제')
    expect(brl).toMatchObject({ dDay: 4, preparationStartDate: '2026-09-10' })

    // 지난 마감은 음수로 남는다 — 위젯이 "지연" 으로 보여 준다
    const overdue = projects.find((project) => project.name === '인공지능 과제')
    expect(overdue?.dDay).toBe(-6)
  })

  it('마감일을 고치면 준비 기간 막대가 따라 움직인다', async () => {
    await signInAs('editor')

    const projects = await fetchProjects()
    const brl = projects.find((project) => project.name === 'BRL 과제')!

    await updateProject(brl.id, {
      name: brl.name,
      submissionStage: brl.submissionStage,
      endDate: '2026-10-15',
      leadTimeDays: 10,
      active: true,
    })

    const events = await fetchEvents({ from: '2026-10-01', to: '2026-10-31' })
    const bar = events.find(
      (event) => event.source === 'AUTO_GENERATED' && event.title === 'BRL 과제',
    )

    expect(bar).toMatchObject({ startDate: '2026-10-05', endDate: '2026-10-15' })
  })

  it('캘린더에서 내리면 막대가 사라진다', async () => {
    await signInAs('editor')

    const projects = await fetchProjects()
    const brl = projects.find((project) => project.name === 'BRL 과제')!

    await updateProject(brl.id, {
      name: brl.name,
      submissionStage: brl.submissionStage,
      endDate: brl.endDate,
      leadTimeDays: brl.leadTimeDays,
      active: false,
    })

    const events = await fetchEvents({ from: '2026-09-01', to: '2026-10-31' })
    expect(
      events.some(
        (event) =>
          event.source === 'AUTO_GENERATED' && event.title === 'BRL 과제',
      ),
    ).toBe(false)
  })
})

describe('구성원', () => {
  it('재직 중인 사람이 먼저, 그 안에서 이름순으로 온다', async () => {
    await signInAs('editor')

    const members = await fetchMembers()

    expect(members.map((member) => member.name)).toEqual([
      '김철수',
      '박민수',
      '이영희',
      '홍길동',
      '최지우',
    ])
    expect(members.at(-1)?.active).toBe(false)
  })

  it('일정에 이름이 남아 있으면 삭제가 409 로 막힌다', async () => {
    await signInAs('editor')

    const members = await fetchMembers()
    const attending = members.find((member) => member.name === '홍길동')!

    await expect(deleteMember(attending.id)).rejects.toMatchObject({
      kind: 'CONFLICT',
    })
  })

  it('아무 데도 쓰이지 않은 사람은 지워진다', async () => {
    await signInAs('editor')

    const members = await fetchMembers()
    const unused = members.find((member) => member.name === '최지우')!

    await deleteMember(unused.id)

    expect((await fetchMembers()).map((member) => member.name)).not.toContain(
      '최지우',
    )
  })
})

describe('일부러 망가뜨리기', () => {
  it('꺼 둔 도메인은 500 으로 돌아온다', async () => {
    // 로딩·오류 화면(KAN-63)을 눈으로 확인할 수 있게 해 두는 손잡이
    await signInAs('editor')
    setFailing(['events'])

    const failure = await fetchEvents({ from: TODAY, to: TODAY }).catch(
      (error: unknown) => error,
    )

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ kind: 'SERVER' })
    // 다른 도메인은 멀쩡하다
    await expect(fetchProjects()).resolves.toBeInstanceOf(Array)
  })
})

describe('테스트 사이 상태 정리', () => {
  /*
   * 목은 새로고침을 넘겨 로그인을 기억하려고 세션 저장소를 쓴다 (db.ts). 테스트 사이에
   * 그 값이 남으면 앞 테스트의 등급이 뒤 테스트로 흘러, 로그아웃 상태를 기대하는
   * 테스트가 혼자 통과하다가 파일 전체를 돌릴 때만 깨진다. 실행 순서에 따라 결과가
   * 달라지는 실패는 원인을 찾기가 가장 어렵다.
   */
  it('앞 테스트의 로그인이 세션 저장소에 남지 않는다', async () => {
    await signInAs('editor')

    expect(window.sessionStorage.getItem('lab-calendar:mock-tier')).toBe(
      'EDITOR',
    )
  })

  it('다음 테스트는 로그아웃 상태로 시작한다', async () => {
    expect(window.sessionStorage.getItem('lab-calendar:mock-tier')).toBeNull()

    const failure = await fetchProjects().catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ kind: 'UNAUTHORIZED' })
  })
})
