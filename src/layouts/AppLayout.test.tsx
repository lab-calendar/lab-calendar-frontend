import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

/**
 * 드로어는 화면을 덮으므로, 열려 있는 동안 Tab 이 뒤쪽 내용으로 새면
 * 키보드 사용자만 보이지 않는 곳으로 포커스를 잃는다 (KAN-64).
 *
 * 드로어 폭인지는 matchMedia 로 판단하므로 테스트에서 그 값을 지정한다.
 */
describe('AppLayout 드로어 포커스', () => {
  const menuButton = () => screen.getByRole('button', { name: '제어 영역 열기' })

  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: query.includes('1023'),
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
          addListener: () => {},
          removeListener: () => {},
        }) as MediaQueryList,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('열면 포커스가 드로어 안으로 들어간다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())

    const sidebar = document.getElementById('sidebar')
    expect(sidebar?.contains(document.activeElement)).toBe(true)
  })

  it('Tab 을 계속 눌러도 드로어 밖으로 나가지 않는다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    const sidebar = document.getElementById('sidebar')

    for (let i = 0; i < 15; i++) {
      await user.tab()
      expect(sidebar?.contains(document.activeElement)).toBe(true)
    }
  })

  it('Shift+Tab 으로도 드로어 밖으로 나가지 않는다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    const sidebar = document.getElementById('sidebar')

    for (let i = 0; i < 5; i++) {
      await user.tab({ shift: true })
      expect(sidebar?.contains(document.activeElement)).toBe(true)
    }
  })

  it('닫으면 포커스가 열기 버튼으로 돌아온다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AppLayout />)

    await user.click(menuButton())
    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(menuButton())
  })
})
