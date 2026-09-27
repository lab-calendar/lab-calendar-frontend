import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy, type ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
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

describe('AppLayout 화면 코드 기다리기 (KAN-75)', () => {
  it('화면이 도착할 때까지 로딩 표시를 보여주고 헤더는 그대로 둔다', async () => {
    let arrive: (module: { default: () => ReactElement }) => void = () => {}
    const SlowPage = lazy(
      () =>
        new Promise<{ default: () => ReactElement }>((resolve) => {
          arrive = resolve
        }),
    )

    renderWithRouter(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<SlowPage />} />
        </Route>
      </Routes>,
    )

    // 사이드바도 자기 데이터를 기다리므로 본문 안에서 찾는다
    const main = screen.getByRole('main')
    expect(within(main).getByRole('status')).toHaveTextContent(
      '화면을 불러오는 중입니다',
    )
    // 본문만 기다린다 — 헤더가 함께 사라지면 화면 전체가 깜빡인다
    expect(screen.getByRole('button', { name: '제어 영역 열기' })).toBeInTheDocument()

    // 헤더 메뉴에 없는 문구를 쓴다 — '과제 관리' 로 두면 메뉴가 먼저 걸려 늘 통과한다
    act(() => arrive({ default: () => <p>도착한 화면</p> }))

    expect(await within(main).findByText('도착한 화면')).toBeInTheDocument()
    // React 는 기다리던 자리를 DOM 에 숨겨 둘 수 있다. 접근성 트리에서 사라졌는지로 본다.
    expect(within(main).queryByRole('status')).toBeNull()
  })
})
