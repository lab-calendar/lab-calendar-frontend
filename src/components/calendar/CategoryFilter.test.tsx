import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../../test/renderWithRouter'
import CategoryFilter from './CategoryFilter'

const EMPTY_HINT = '표시할 카테고리를 하나 이상 선택해 주세요.'

describe('CategoryFilter', () => {
  it('카테고리를 라벨 텍스트와 함께 노출한다', () => {
    renderWithRouter(<CategoryFilter />)

    expect(screen.getByLabelText('과제/연구 관리')).toBeInTheDocument()
    expect(screen.getByLabelText('랩실 주기적 일정')).toBeInTheDocument()
    expect(screen.getByLabelText('카드/경비 사용')).toBeInTheDocument()
  })

  it('기본값은 전체 선택이다', () => {
    renderWithRouter(<CategoryFilter />)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeChecked()
    }
    expect(screen.queryByText(EMPTY_HINT)).not.toBeInTheDocument()
  })

  it('URL 의 선택 상태를 반영한다', () => {
    renderWithRouter(<CategoryFilter />, { route: '/?categories=lab' })

    expect(screen.getByLabelText('과제/연구 관리')).not.toBeChecked()
    expect(screen.getByLabelText('랩실 주기적 일정')).toBeChecked()
    expect(screen.getByLabelText('카드/경비 사용')).not.toBeChecked()
  })

  it('클릭하면 해당 카테고리가 해제된다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<CategoryFilter />)

    await user.click(screen.getByLabelText('과제/연구 관리'))

    expect(screen.getByLabelText('과제/연구 관리')).not.toBeChecked()
    expect(screen.getByLabelText('랩실 주기적 일정')).toBeChecked()
    expect(screen.getByLabelText('카드/경비 사용')).toBeChecked()
  })

  it('전체를 해제하면 안내 문구를 보여준다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<CategoryFilter />)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }

    expect(screen.getByText(EMPTY_HINT)).toBeInTheDocument()
  })
})
