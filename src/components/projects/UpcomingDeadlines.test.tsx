import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useLocation } from 'react-router-dom'
import { fetchProjects } from '../../api/projects'
import { ApiError } from '../../api/errors'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Project } from '../../types/domain'
import UpcomingDeadlines from './UpcomingDeadlines'

vi.mock('../../api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  toProjectInput: (project: Project) => project,
}))

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'BRL 과제',
    submissionStage: '연차보고서',
    endDate: '2026-09-26',
    leadTimeDays: 21,
    active: true,
    dDay: 10,
    preparationStartDate: '2026-09-05',
    ...overrides,
  }
}

/**
 * 라우터가 들고 있는 주소를 화면에 드러낸다.
 *
 * MemoryRouter 는 window.location 을 건드리지 않으므로 그쪽을 봐서는 알 수 없다.
 */
function LocationProbe() {
  const { search } = useLocation()
  return <output data-testid="search">{search}</output>
}

/** 서버가 내려주는 순서 그대로. 정렬은 서버가 한다. */
function given(projects: Project[]) {
  vi.mocked(fetchProjects).mockResolvedValue(projects)
}

describe('UpcomingDeadlines', () => {
  it('서버가 계산한 D-Day 를 그대로 보여준다', async () => {
    given([project({ dDay: 10 })])
    renderWithRouter(<UpcomingDeadlines />)

    // 화면에서 다시 계산하면 기기 시계·타임존에 따라 사람마다 다른 숫자를 본다
    expect(await screen.findByText('D-10')).toBeInTheDocument()
    expect(screen.getByText('BRL 과제')).toBeInTheDocument()
    expect(screen.getByText('연차보고서')).toBeInTheDocument()
  })

  it('오늘 마감은 D-DAY 로 표시한다', async () => {
    given([project({ dDay: 0 })])
    renderWithRouter(<UpcomingDeadlines />)

    expect(await screen.findByText('D-DAY')).toBeInTheDocument()
  })

  it('지난 마감은 D+ 로 표시한다', async () => {
    given([project({ dDay: -3 })])
    renderWithRouter(<UpcomingDeadlines />)

    // 아직 켜져 있다는 것은 끝나지 않았다는 뜻이다. 감추면 더 급한 것을 놓친다.
    expect(await screen.findByText('D+3')).toBeInTheDocument()
  })

  it('세 건까지만 보여준다', async () => {
    given([
      project({ id: '1', name: '첫째' }),
      project({ id: '2', name: '둘째' }),
      project({ id: '3', name: '셋째' }),
      project({ id: '4', name: '넷째' }),
    ])
    renderWithRouter(<UpcomingDeadlines />)

    expect(await screen.findByText('첫째')).toBeInTheDocument()
    expect(screen.getByText('셋째')).toBeInTheDocument()
    expect(screen.queryByText('넷째')).toBeNull()
  })

  it('숨긴 과제는 빼고 센다', async () => {
    // 캘린더에서 내리려고 끈 것을 위젯이 다시 들이밀면 끈 의미가 없다
    given([
      project({ id: '1', name: '숨긴 과제', active: false }),
      project({ id: '2', name: '살아있는 과제' }),
    ])
    renderWithRouter(<UpcomingDeadlines />)

    expect(await screen.findByText('살아있는 과제')).toBeInTheDocument()
    expect(screen.queryByText('숨긴 과제')).toBeNull()
  })

  it('순서를 다시 정하지 않는다', async () => {
    // 활성 우선·마감 임박 순은 서버가 정한 것을 그대로 따른다
    given([
      project({ id: '1', name: '먼저', dDay: 2 }),
      project({ id: '2', name: '나중', dDay: 30 }),
    ])
    renderWithRouter(<UpcomingDeadlines />)

    const names = (await screen.findAllByRole('button')).map(
      (button) => button.textContent,
    )
    expect(names[0]).toContain('먼저')
    expect(names[1]).toContain('나중')
  })

  it('제출 단계가 없으면 과제명만 보여준다', async () => {
    given([project({ submissionStage: undefined })])
    renderWithRouter(<UpcomingDeadlines />)

    expect(await screen.findByText('BRL 과제')).toBeInTheDocument()
    expect(screen.queryByText('연차보고서')).toBeNull()
  })

  it('누르면 그 마감이 있는 날로 달력을 옮긴다', async () => {
    given([project({ endDate: '2026-09-26' })])
    renderWithRouter(
      <>
        <UpcomingDeadlines />
        <LocationProbe />
      </>,
    )

    await userEvent.click(await screen.findByRole('button', { name: /BRL/ }))

    // 달력이 읽어 갈 자리는 URL 이다 — 새로고침해도 남고 링크로 건넬 수 있다
    expect(screen.getByTestId('search')).toHaveTextContent('date=2026-09-26')
  })

  it('숫자를 소리로도 알아들을 수 있게 풀어 준다', async () => {
    given([project({ dDay: 10 })])
    renderWithRouter(<UpcomingDeadlines />)

    // "디 마이너스 십" 으로 읽히면 아무 뜻이 되지 않는다
    expect(
      await screen.findByRole('button', { name: /마감까지 10일 남음/ }),
    ).toBeInTheDocument()
  })

  it('보여줄 과제가 없으면 등록하라고 안내한다', async () => {
    given([])
    renderWithRouter(<UpcomingDeadlines />)

    expect(
      await screen.findByText(/다가오는 과제 마감이 없습니다/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '과제 관리' })).toBeInTheDocument()
  })

  it('숨긴 과제뿐이어도 빈 상태로 본다', async () => {
    given([project({ active: false })])
    renderWithRouter(<UpcomingDeadlines />)

    expect(
      await screen.findByText(/다가오는 과제 마감이 없습니다/),
    ).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    vi.mocked(fetchProjects).mockRejectedValue(
      new ApiError('SERVER', '서버에 문제가 발생했습니다.'),
    )
    renderWithRouter(<UpcomingDeadlines />)

    expect(
      await screen.findByText('다가오는 마감을 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument()
  })
})
