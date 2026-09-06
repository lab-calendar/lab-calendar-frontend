import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../test/renderWithRouter'
import AppLayout from './AppLayout'

/**
 * 드로어는 CSS 미디어 쿼리로 노출을 제어하므로 jsdom 에서는 폭을 검증할 수 없다.
 * 여기서는 열림/닫힘 상태 전환과 접근성 속성만 확인한다.
 */
describe('AppLayout 제어 영역 드로어', () => {
  const menuButton = () => screen.getByRole('button', { name: '제어 영역 열기' })
  const backdrop = () => screen.queryByRole('button', { name: '제어 영역 닫기' })

  it('기본은 닫힌 상태다', () => {
    renderWithRouter(<AppLayout />)

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton()).toHaveAttribute('aria-controls', 'sidebar')
    expect(backdrop()).not.toBeInTheDocument()
  })

  it('토글 버튼으로 열고 닫는다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
    expect(backdrop()).toBeInTheDocument()

    await user.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
    expect(backdrop()).not.toBeInTheDocument()
  })

  it('배경을 누르면 닫힌다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    await user.click(backdrop()!)

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Escape 로 닫힌다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    await user.keyboard('{Escape}')

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })
})
