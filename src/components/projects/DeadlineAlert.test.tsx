import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchProjects } from '../../api/projects'
import { renderWithRouter } from '../../test/renderWithRouter'
import { todayIso } from '../../utils/date'
import type { Project } from '../../types/domain'
import DeadlineAlert from './DeadlineAlert'

vi.mock('../../api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  toProjectInput: (project: Project) => project,
}))

const STORAGE_KEY = 'lab-calendar:deadline-alert-dismissed-on'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'BRL 과제',
    submissionStage: '연차보고서',
    endDate: '2026-09-26',
    leadTimeDays: 21,
    active: true,
    dDay: 3,
    preparationStartDate: '2026-09-05',
    ...overrides,
  }
}

function given(projects: Project[]) {
  vi.mocked(fetchProjects).mockResolvedValue(projects)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('DeadlineAlert', () => {
  it('마감이 임박했으면 들어올 때 알린다', async () => {
    given([project({ dDay: 3 })])
    renderWithRouter(<DeadlineAlert />)

    expect(
      await screen.findByText(/마감이 임박한 과제가 1건 있습니다/),
    ).toBeInTheDocument()
    expect(screen.getByText(/BRL 과제 \(연차보고서\)/)).toBeInTheDocument()
  })

  it('지난 마감도 함께 알린다', async () => {
    given([project({ dDay: -2 })])
    renderWithRouter(<DeadlineAlert />)

    expect(
      await screen.findByText(/마감이 임박한 과제가 1건 있습니다/),
    ).toBeInTheDocument()
    expect(await screen.findByText('D+2')).toBeInTheDocument()
  })

  it('급한 것이 없으면 아무것도 띄우지 않는다', async () => {
    given([project({ dDay: 60 })])
    const { container } = renderWithRouter(<DeadlineAlert />)

    // 조회가 끝나기를 기다린 뒤에도 비어 있어야 한다
    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(container.querySelector('dialog')).toBeNull()
  })

  it('숨긴 과제는 급해도 알리지 않는다', async () => {
    given([project({ dDay: 1, active: false })])
    const { container } = renderWithRouter(<DeadlineAlert />)

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(container.querySelector('dialog')).toBeNull()
  })

  it('확인을 누르면 오늘은 다시 뜨지 않는다', async () => {
    given([project({ dDay: 3 })])
    const { unmount } = renderWithRouter(<DeadlineAlert />)

    await screen.findByText(/마감이 임박한 과제가 1건 있습니다/)
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    // 닫았다는 사실을 오늘 날짜로 적어 둔다
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(todayIso())

    unmount()
    const { container } = renderWithRouter(<DeadlineAlert />)
    await waitFor(() => expect(fetchProjects).toHaveBeenCalled())
    expect(container.querySelector('dialog')).toBeNull()
  })

  it('어제 닫은 것은 오늘 다시 뜬다', async () => {
    window.localStorage.setItem(STORAGE_KEY, '2020-01-01')
    given([project({ dDay: 3 })])
    renderWithRouter(<DeadlineAlert />)

    expect(
      await screen.findByText(/마감이 임박한 과제가 1건 있습니다/),
    ).toBeInTheDocument()
  })

  it('누르면 그 마감이 있는 날로 달력을 옮긴다', async () => {
    given([project({ dDay: 3, endDate: '2026-09-26' })])
    renderWithRouter(<DeadlineAlert />)

    await screen.findByText(/마감이 임박한 과제가 1건 있습니다/)
    await userEvent.click(screen.getByRole('button', { name: /BRL 과제/ }))

    // 옮기고 나면 알림은 물러난다
    await waitFor(() =>
      expect(screen.queryByText(/마감이 임박한 과제가/)).toBeNull(),
    )
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(todayIso())
  })

  it('숫자를 소리로도 알아들을 수 있게 풀어 준다', async () => {
    given([project({ dDay: 0 })])
    renderWithRouter(<DeadlineAlert />)

    expect(
      await screen.findByRole('button', { name: /오늘 마감/ }),
    ).toBeInTheDocument()
  })

  it('여러 건이면 건수를 함께 알린다', async () => {
    given([
      project({ id: '1', dDay: -1 }),
      project({ id: '2', dDay: 2 }),
      project({ id: '3', dDay: 90 }),
    ])
    renderWithRouter(<DeadlineAlert />)

    // 90일 남은 것은 세지 않는다
    expect(
      await screen.findByText(/마감이 임박한 과제가 2건 있습니다/),
    ).toBeInTheDocument()
  })
})
