import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter, VIEWER_SESSION } from '../../test/renderWithRouter'
import AppLayout from '../../layouts/AppLayout'
import ProjectsPage from '../../pages/ProjectsPage'
import type { Project } from '../../types/domain'
import { fetchProjects } from '../../api/projects'

/**
 * 조회 등급에서 쓰기 진입점이 화면에 남지 않는지 (KAN-36).
 *
 * 화면에서 가리는 것은 편의일 뿐 보안 경계가 아니다 — 실제 차단은 서버(KAN-35)가
 * 하고, 그쪽은 백엔드 테스트가 따로 검증한다. 여기서 보는 것은 "누르면 403 이 날
 * 버튼을 애초에 보여주지 않는다" 뿐이다.
 */

vi.mock('../../api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  toProjectInput: (project: Project) => project,
}))

const PROJECT: Project = {
  id: 'p1',
  name: 'BRL 과제',
  submissionStage: '연차보고서',
  endDate: '2026-09-26',
  leadTimeDays: 3,
  preparationStartDate: '2026-09-05',
  dDay: 6,
  active: true,
}

describe('조회 등급 화면', () => {
  it('사이드바에 일정 등록 폼을 두지 않는다', () => {
    renderWithRouter(<AppLayout />, { session: VIEWER_SESSION })

    expect(screen.queryByRole('heading', { name: '일정 등록' })).toBeNull()
  })

  it('편집 등급에는 그대로 보인다', () => {
    renderWithRouter(<AppLayout />)

    expect(screen.getByRole('heading', { name: '일정 등록' })).toBeInTheDocument()
  })

  it('카테고리 필터는 조회 등급에도 남는다', () => {
    // 읽기는 허용된 등급이다. 필터까지 걷어내면 볼 수 있는 것도 못 고르게 된다.
    renderWithRouter(<AppLayout />, { session: VIEWER_SESSION })

    expect(
      screen.getByRole('heading', { name: '카테고리 필터' }),
    ).toBeInTheDocument()
  })

  it('조회 전용임을 화면에 알린다', () => {
    renderWithRouter(<AppLayout />, { session: VIEWER_SESSION })

    // 버튼이 없는 것만으로는 권한이 없어서인지 기능이 없어서인지 알 수 없다
    expect(screen.getByText('조회 전용')).toBeInTheDocument()
  })

  it('편집 등급에는 조회 전용 표시를 붙이지 않는다', () => {
    renderWithRouter(<AppLayout />)

    expect(screen.queryByText('조회 전용')).toBeNull()
  })

  it('과제 화면에 등록 폼과 수정·삭제 버튼을 두지 않는다', async () => {
    vi.mocked(fetchProjects).mockResolvedValue([PROJECT])
    renderWithRouter(<ProjectsPage />, { session: VIEWER_SESSION })

    expect(await screen.findByText('BRL 과제')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull()
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    expect(screen.queryByRole('button', { name: '캘린더에서 숨기기' })).toBeNull()
  })

  it('편집 등급에는 수정·삭제 버튼이 있다', async () => {
    vi.mocked(fetchProjects).mockResolvedValue([PROJECT])
    renderWithRouter(<ProjectsPage />)

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })
})
