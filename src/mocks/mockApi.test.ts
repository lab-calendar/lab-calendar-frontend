import { describe, expect, it } from 'vitest'
import { login, logout } from '../api/auth'
import {
  applyCardImport,
  fetchCardImports,
  previewCardImport,
} from '../api/cardImports'
import { fetchCategories } from '../api/categories'
import { ApiError } from '../api/errors'
import { createEvent, fetchEvents } from '../api/events'
import { deleteMember, fetchMembers } from '../api/members'
import { fetchProjects, updateProject } from '../api/projects'
import { setUpMockApi } from '../test/mockApi'
import { setCardImportCase, setFailing } from './scenario'

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

describe('카드 내역 가져오기', () => {
  /*
   * 파일 이름은 실어 보내는 경로에 따라 `blob` 으로 바뀌어 도착한다. 토큰은 크기도
   * 함께 보므로, 다른 파일을 흉내 낼 때는 내용 길이를 다르게 준다.
   */
  function xlsx(name: string, content = 'xlsx'): File {
    return new File([content], name, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  it('미리보기는 아무것도 저장하지 않는다', async () => {
    await signInAs('editor')
    const before = await fetchCardImports()

    const preview = await previewCardImport(xlsx('회의록 인원.xlsx'))

    expect(preview.dryRun).toBe(true)
    expect(preview.previewToken).toBeTruthy()
    // 미리보기만으로 이력이 늘면 올려 보지도 못하고 기록이 쌓인다
    expect(await fetchCardImports()).toHaveLength(before.length)
  })

  it('반영은 미리보기 토큰을 요구한다', async () => {
    await signInAs('editor')
    const preview = await previewCardImport(xlsx('회의록 인원.xlsx'))

    const applied = await applyCardImport(xlsx('회의록 인원.xlsx'), preview.previewToken)

    expect(applied.dryRun).toBe(false)
    expect((await fetchCardImports())[0]).toMatchObject({ status: 'SUCCESS' })
  })

  it('낡은 미리보기 토큰으로 반영하면 PREVIEW_STALE 이다', async () => {
    /*
     * 미리보기를 보여준 그 상태 그대로 반영되는지 서버가 확인한다. 화면은 이 코드를
     * 보고 미리보기부터 다시 받는 흐름으로 돌아간다 (설계 §6.2).
     */
    await signInAs('editor')
    const first = await previewCardImport(xlsx('첫 파일.xlsx'))
    // 다른 파일로 미리보기를 다시 받으면 앞의 토큰은 더 이상 유효하지 않다
    await previewCardImport(xlsx('다른 파일.xlsx'))

    const failure = await applyCardImport(
      xlsx('첫 파일.xlsx'),
      first.previewToken,
    ).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ kind: 'CONFLICT', code: 'PREVIEW_STALE' })
  })

  it('한 번 반영한 토큰은 다시 쓸 수 없다', async () => {
    await signInAs('editor')
    const preview = await previewCardImport(xlsx('회의록 인원.xlsx'))
    await applyCardImport(xlsx('회의록 인원.xlsx'), preview.previewToken)

    const failure = await applyCardImport(
      xlsx('회의록 인원.xlsx'),
      preview.previewToken,
    ).catch((error: unknown) => error)

    expect(failure).toMatchObject({ code: 'PREVIEW_STALE' })
    // 거절된 재시도가 이력을 늘리지 않는다
    expect(await fetchCardImports()).toHaveLength(3)
  })

  it('반영할 달이 하나도 없으면 거절한다', async () => {
    await signInAs('editor')
    setCardImportCase('empty')
    const preview = await previewCardImport(xlsx('empty.xlsx'))

    const failure = await applyCardImport(
      xlsx('empty.xlsx'),
      preview.previewToken,
    ).catch((error: unknown) => error)

    expect(failure).toMatchObject({ code: 'NO_APPLICABLE_MONTHS' })
  })

  it('오류가 있는 달은 막히고 나머지만 반영된다', async () => {
    await signInAs('editor')
    setCardImportCase('blocked')

    const preview = await previewCardImport(xlsx('blocked.xlsx'))

    expect(preview.months).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ month: '2026-09', status: 'BLOCKED' }),
        expect.objectContaining({ month: '2026-08', status: 'READY' }),
      ]),
    )
    expect(preview.problems.some((problem) => problem.level === 'ERROR')).toBe(true)

    const applied = await applyCardImport(xlsx('blocked.xlsx'), preview.previewToken)
    // 일부만 반영된 회차는 이력에서 구분된다
    expect((await fetchCardImports())[0].status).toBe('PARTIAL')
    expect(applied.totals.blockedMonths).toBe(1)
  })

  it('조회 등급은 미리보기도 이력도 받지 못한다', async () => {
    // 지출을 가리면서 "몇 건 들어왔다" 를 알려 주면 가린 의미가 없다 (KAN-35)
    await signInAs('viewer')

    await expect(fetchCardImports()).rejects.toMatchObject({ kind: 'FORBIDDEN' })
    await expect(previewCardImport(xlsx('회의록 인원.xlsx'))).rejects.toMatchObject({
      kind: 'FORBIDDEN',
    })
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
