import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCategories } from '../../api/categories'
import { ApiError } from '../../api/errors'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Category } from '../../types/domain'
import CategoryFilter from './CategoryFilter'

vi.mock('../../api/categories', () => ({
  fetchCategories: vi.fn(),
}))

const CATEGORIES: Category[] = [
  { id: 1, key: 'project', name: '과제/연구 관리' },
  { id: 2, key: 'lab', name: '랩실 주기적 일정' },
  { id: 3, key: 'card', name: '카드/경비 사용' },
]

const EMPTY_HINT = '표시할 카테고리를 하나 이상 선택해 주세요.'

beforeEach(() => {
  vi.mocked(fetchCategories).mockResolvedValue(CATEGORIES)
})

describe('CategoryFilter', () => {
  it('서버가 준 이름으로 카테고리를 노출한다', async () => {
    renderWithRouter(<CategoryFilter />)

    expect(await screen.findByLabelText('과제/연구 관리')).toBeInTheDocument()
    expect(screen.getByLabelText('랩실 주기적 일정')).toBeInTheDocument()
    expect(screen.getByLabelText('카드/경비 사용')).toBeInTheDocument()
  })

  it('불러오는 동안 안내를 보여준다', () => {
    renderWithRouter(<CategoryFilter />)

    expect(screen.getByText('카테고리를 불러오는 중입니다…')).toBeInTheDocument()
  })

  it('조회에 실패하면 안내를 보여준다', async () => {
    vi.mocked(fetchCategories).mockRejectedValue(
      new ApiError('SERVER', '서버 오류'),
    )
    renderWithRouter(<CategoryFilter />)

    expect(
      await screen.findByText('카테고리를 불러오지 못했습니다.'),
    ).toBeInTheDocument()
  })

  it('기본값은 전체 선택이다', async () => {
    renderWithRouter(<CategoryFilter />)
    await screen.findByLabelText('과제/연구 관리')

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeChecked()
    }
    expect(screen.queryByText(EMPTY_HINT)).not.toBeInTheDocument()
  })

  it('URL 의 선택 상태를 반영한다', async () => {
    renderWithRouter(<CategoryFilter />, { route: '/?categories=lab' })

    expect(await screen.findByLabelText('랩실 주기적 일정')).toBeChecked()
    expect(screen.getByLabelText('과제/연구 관리')).not.toBeChecked()
    expect(screen.getByLabelText('카드/경비 사용')).not.toBeChecked()
  })

  it('클릭하면 해당 카테고리가 해제된다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<CategoryFilter />)

    await user.click(await screen.findByLabelText('과제/연구 관리'))

    expect(screen.getByLabelText('과제/연구 관리')).not.toBeChecked()
    expect(screen.getByLabelText('랩실 주기적 일정')).toBeChecked()
    expect(screen.getByLabelText('카드/경비 사용')).toBeChecked()
  })

  it('전체를 해제하면 안내 문구를 보여준다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<CategoryFilter />)
    await screen.findByLabelText('과제/연구 관리')

    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }

    expect(screen.getByText(EMPTY_HINT)).toBeInTheDocument()
  })
})
