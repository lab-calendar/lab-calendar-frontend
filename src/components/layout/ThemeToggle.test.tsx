import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'
import { THEME_STORAGE_KEY } from '../../theme/theme'

/**
 * 테마 전환 버튼 (KAN-106).
 *
 * jsdom 에는 `matchMedia` 가 없어 기기 설정을 대역으로 세운다. 그래야 "기기가
 * 어두운데 밝게 고정" 같은, 실제로 틀리기 쉬운 조합을 짚어 볼 수 있다.
 */
describe('테마 전환 버튼', () => {
  const setSystemDark = (dark: boolean) => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({
        matches: dark && query.includes('dark'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    )
  }

  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    setSystemDark(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const button = () => screen.getByRole('button', { name: /화면 테마/ })

  it('처음에는 기기 설정을 따라간다', () => {
    setSystemDark(true)
    render(<ThemeToggle />)

    expect(button()).toHaveAccessibleName(/기기 설정/)
    // 고른 적이 없으므로 기기가 어두우면 어둡다
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('누를 때마다 기기 설정 → 밝게 → 어둡게 로 돌고 되돌아온다', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(button())
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(button()).toHaveAccessibleName(/밝게/)

    await user.click(button())
    expect(document.documentElement.dataset.theme).toBe('dark')

    // 고리다 — 기기 설정으로 돌아올 길이 있어야 한다
    await user.click(button())
    expect(button()).toHaveAccessibleName(/기기 설정/)
  })

  it('고른 값을 기억하고, 기기 설정으로 돌아오면 지운다', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(button())
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    await user.click(button())
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await user.click(button())
    // 기기를 따라가는 것이 기본값이라 저장해 둘 것이 없다
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('기억해 둔 값이 기기 설정을 이긴다', () => {
    setSystemDark(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    render(<ThemeToggle />)

    // 기기가 어두워도 밝게 고정했으면 밝다
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(button()).toHaveAccessibleName(/밝게/)
  })

  it('다음에 무엇이 되는지를 이름에 담는다', () => {
    render(<ThemeToggle />)

    // 아이콘만으로는 소리로 알 수 없다
    expect(button()).toHaveAccessibleName('화면 테마: 기기 설정. 누르면 밝게')
  })

  it('저장소가 막혀 있어도 뜬다', () => {
    const blocked = () => {
      throw new Error('denied')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)

    expect(() => render(<ThemeToggle />)).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
