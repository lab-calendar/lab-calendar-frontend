import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocation } from 'react-router-dom'
import { fetchProjects } from '../../api/projects'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Project } from '../../types/domain'
import { todayIso } from '../../utils/date'
import DeadlineNotice from './DeadlineNotice'

vi.mock('../../api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  toProjectInput: (project: Project) => project,
}))

const STORAGE_KEY = 'lab-calendar:deadline-notice-dismissed-on'

function project(overrides: Partial<Project> = {}): Project {
  const dDay = overrides.dDay ?? 3

  return {
    id: 'p1',
    name: 'BRL 과제',
    submissionStage: '연차보고서',
    endDate: '2026-09-26',
    leadTimeDays: 21,
    active: true,
    dDay,
    preparationStartDate: '2026-09-05',
    // 임박 여부는 서버가 정한다. 여기서는 그 규칙(오늘 포함 7일)을 흉내 내 자리를 채운다
    deadlineImminent: dDay >= 0 && dDay <= 7,
    ...overrides,
  }
}

function given(projects: Project[]) {
  vi.mocked(fetchProjects).mockResolvedValue(projects)
}

/** 달력이 읽어 갈 자리는 URL 이다 — MemoryRouter 라 주소창 대신 여기서 확인한다. */
function LocationProbe() {
  const { search } = useLocation()
  return <output data-testid="search">{search}</output>
}

const notice = () => screen.findByRole('complementary')

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('DeadlineNotice', () => {
  it('마감이 임박했으면 달력 위에 알린다', async () => {
    given([project({ dDay: 3 })])
    renderWithRouter(<DeadlineNotice />)

    const alert = await notice()
    expect(within(alert).getByText(/마감이 임박한 과제 1건/)).toBeInTheDocument()
    expect(within(alert).getByText('BRL 과제')).toBeInTheDocument()
    expect(within(alert).getByText('연차보고서')).toBeInTheDocument()
  })

  it('지난 마감도 함께 알린다', async () => {
    given([project({ dDay: -2 })])
    renderWithRouter(<DeadlineNotice />)

    expect(within(await notice()).getByText('D+2')).toBeInTheDocument()
  })

  it('급한 것이 없으면 아무것도 띄우지 않는다', async () => {
    // 다가오는 마감을 늘 늘어놓는 자리가 아니다 — 챙길 것이 생겼을 때만 뜬다 (KAN-80)
    given([project({ dDay: 30 })])
    renderWithRouter(<DeadlineNotice />)

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('숨긴 과제는 급해도 알리지 않는다', async () => {
    given([project({ dDay: 1, active: false })])
    renderWithRouter(<DeadlineNotice />)

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('여러 건이면 건수를 함께 알린다', async () => {
    given([
      project({ id: '1', dDay: 1 }),
      project({ id: '2', name: '창의도전 과제', dDay: -3 }),
    ])
    renderWithRouter(<DeadlineNotice />)

    expect(
      within(await notice()).getByText(/마감이 임박한 과제 2건/),
    ).toBeInTheDocument()
  })

  it('닫으면 오늘은 다시 뜨지 않는다', async () => {
    const user = userEvent.setup()
    given([project({ dDay: 2 })])
    const { unmount } = renderWithRouter(<DeadlineNotice />)

    await user.click(
      within(await notice()).getByRole('button', { name: '마감 알림 닫기' }),
    )
    expect(screen.queryByRole('complementary')).toBeNull()

    // 화면을 다시 열어도 그대로 닫혀 있다
    unmount()
    renderWithRouter(<DeadlineNotice />)
    await waitFor(() => expect(fetchProjects).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('어제 닫은 것은 오늘 다시 뜬다', async () => {
    window.localStorage.setItem(STORAGE_KEY, '2020-01-01')
    given([project({ dDay: 2 })])
    renderWithRouter(<DeadlineNotice />)

    expect(await notice()).toBeInTheDocument()
    // 오늘 다시 닫으면 오늘 날짜로 기록된다
    await userEvent.click(
      screen.getByRole('button', { name: '마감 알림 닫기' }),
    )
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(todayIso())
  })

  it('누르면 그 마감이 있는 달로 달력을 옮긴다', async () => {
    const user = userEvent.setup()
    given([project({ dDay: 2, endDate: '2026-10-15' })])
    renderWithRouter(
      <>
        <DeadlineNotice />
        <LocationProbe />
      </>,
    )

    await user.click(within(await notice()).getByRole('button', { name: /BRL 과제/ }))

    // 새로고침해도 남고 링크로 건넬 수 있는 자리에 적는다
    expect(screen.getByTestId('search')).toHaveTextContent('date=2026-10-15')
    // 눌렀다고 알림이 닫히지는 않는다 — 다른 건도 이어서 볼 수 있어야 한다
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('숫자를 소리로도 알아들을 수 있게 풀어 준다', async () => {
    given([project({ dDay: 0 })])
    renderWithRouter(<DeadlineNotice />)

    expect(within(await notice()).getByText('오늘 마감')).toBeInTheDocument()
  })

  it('과제를 불러오지 못하면 조용히 비운다', async () => {
    // 덧붙는 알림이라 달력 위에 오류 상자를 띄우지 않는다. 과제 화면이 알려 준다.
    vi.mocked(fetchProjects).mockRejectedValue(new Error('offline'))
    renderWithRouter(<DeadlineNotice />)

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(screen.queryByRole('complementary')).toBeNull()
  })
})
