import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from '../api/projects'
import { renderWithRouter } from '../test/renderWithRouter'
import type { Project, ProjectInput } from '../types/domain'
import ProjectsPage from './ProjectsPage'

vi.mock('../api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  toProjectInput: ({
    name,
    submissionStage,
    endDate,
    leadTimeWeeks,
    active,
  }: Project): ProjectInput => ({
    name,
    submissionStage,
    endDate,
    leadTimeWeeks,
    active,
  }),
}))

const ACTIVE: Project = {
  id: 'p1',
  name: 'BRL 과제',
  submissionStage: '연차보고서',
  endDate: '2026-09-26',
  leadTimeWeeks: 3,
  active: true,
  dDay: 20,
  preparationStartDate: '2026-09-05',
}

const HIDDEN: Project = {
  id: 'p2',
  name: '산학협력 과제',
  endDate: '2026-07-01',
  leadTimeWeeks: 2,
  active: false,
  dDay: -67,
  preparationStartDate: '2026-06-17',
}

beforeEach(() => {
  vi.mocked(fetchProjects).mockResolvedValue([ACTIVE, HIDDEN])
  vi.mocked(createProject).mockResolvedValue({ ...ACTIVE, id: 'new' })
  vi.mocked(updateProject).mockResolvedValue(ACTIVE)
  vi.mocked(deleteProject).mockResolvedValue(undefined)
})

/** 과제 카드를 과제명으로 찾는다. */
async function cardOf(name: string) {
  const heading = await screen.findByText(name)
  return heading.closest('li') as HTMLElement
}

describe('ProjectsPage', () => {
  it('과제의 마감일, 준비 기간, D-Day 를 보여준다', async () => {
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('BRL 과제')
    expect(within(card).getByText('연차보고서')).toBeInTheDocument()
    expect(within(card).getByText('D-20')).toBeInTheDocument()
    expect(within(card).getByText('3주')).toBeInTheDocument()
    expect(within(card).getByText(/2026년 9월 5일/)).toBeInTheDocument()
  })

  it('비활성 과제는 D-Day 대신 숨김 상태를 표시한다', async () => {
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('산학협력 과제')
    expect(within(card).getByText('캘린더에서 숨김')).toBeInTheDocument()
    expect(within(card).queryByText(/^D[-+]/)).not.toBeInTheDocument()
  })

  it('과제를 등록하면 입력한 값으로 저장한다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    await user.type(screen.getByLabelText('과제명'), '신규 과제')
    await user.type(screen.getByLabelText('제출 단계'), '착수보고서')
    await user.clear(screen.getByLabelText('준비 기간 (주)'))
    await user.type(screen.getByLabelText('준비 기간 (주)'), '5')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '신규 과제',
          submissionStage: '착수보고서',
          leadTimeWeeks: 5,
          active: true,
        }),
      )
    })
  })

  it('과제명이 비어 있으면 저장하지 않고 오류를 보여준다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('과제명을 입력해 주세요.')).toBeInTheDocument()
    expect(createProject).not.toHaveBeenCalled()
  })

  it('준비 기간이 허용 범위를 벗어나면 저장하지 않는다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    await user.type(screen.getByLabelText('과제명'), '신규 과제')
    await user.clear(screen.getByLabelText('준비 기간 (주)'))
    await user.type(screen.getByLabelText('준비 기간 (주)'), '52')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(
      await screen.findByText(/준비 기간은 1주 이상 26주 이하/),
    ).toBeInTheDocument()
    expect(createProject).not.toHaveBeenCalled()
  })

  it('수정을 누르면 폼이 해당 과제로 채워진다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('BRL 과제')
    await user.click(within(card).getByRole('button', { name: '수정' }))

    expect(screen.getByRole('heading', { name: '과제 수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('과제명')).toHaveValue('BRL 과제')
    expect(screen.getByLabelText('준비 기간 (주)')).toHaveValue(3)
  })

  it('새 과제로 돌아가면 폼이 비워진다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('BRL 과제')
    await user.click(within(card).getByRole('button', { name: '수정' }))
    await user.click(screen.getByRole('button', { name: '새 과제로' }))

    expect(screen.getByRole('heading', { name: '새 과제' })).toBeInTheDocument()
    expect(screen.getByLabelText('과제명')).toHaveValue('')
  })

  it('캘린더에서 숨기면 활성 여부만 바꿔 저장한다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('BRL 과제')
    await user.click(
      within(card).getByRole('button', { name: '캘린더에서 숨기기' }),
    )

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 'BRL 과제', active: false }),
      )
    })
  })

  it('삭제는 한 번 더 확인한 뒤에 실행한다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProjectsPage />)

    const card = await cardOf('BRL 과제')
    await user.click(within(card).getByRole('button', { name: '삭제' }))

    expect(deleteProject).not.toHaveBeenCalled()
    expect(
      within(card).getByText(/캘린더의 준비 기간 일정도 사라집니다/),
    ).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith('p1'))
  })

  it('과제가 없으면 안내 문구를 보여준다', async () => {
    vi.mocked(fetchProjects).mockResolvedValue([])
    renderWithRouter(<ProjectsPage />)

    expect(
      await screen.findByText(/등록된 과제가 없습니다/),
    ).toBeInTheDocument()
  })
})
