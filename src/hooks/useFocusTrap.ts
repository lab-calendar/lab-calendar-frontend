import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * 열려 있는 동안 포커스를 컨테이너 안에 가둔다.
 *
 * 드로어처럼 화면을 덮는 요소는 뒤쪽 내용이 눈에는 안 보여도 Tab 으로는 계속
 * 닿는다. 키보드 사용자만 보이지 않는 곳으로 포커스를 잃는 셈이라 가둬 둔다.
 * 열 때 안으로 옮기고, 닫을 때 열기 전 자리로 되돌린다.
 *
 * 네이티브 `dialog` 는 `showModal()` 이 같은 일을 해 주므로 여기서 다루지 않는다.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusablesIn = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    /*
     * 안에 아무것도 없으면 컨테이너 자신에게 준다 (tabIndex={-1} 필요).
     *
     * 드로어는 visibility 를 바꾸며 열리는데, 여는 렌더와 같은 시점에는 아직
     * 감춰진 상태로 계산돼 focus() 가 먹지 않는다. 들어갔는지 확인하고, 안
     * 들어갔으면 스타일이 반영된 다음 프레임에 한 번 더 시도한다.
     */
    const focusInside = () => {
      const [first] = focusablesIn()
      ;(first ?? container).focus()
      return container.contains(document.activeElement)
    }

    const retryFrame = focusInside() ? 0 : requestAnimationFrame(focusInside)


    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Tab') return

      const items = focusablesIn()
      if (items.length === 0) {
        keyEvent.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement

      if (keyEvent.shiftKey) {
        if (current === first || !container.contains(current)) {
          keyEvent.preventDefault()
          last.focus()
        }
        return
      }

      if (current === last || !container.contains(current)) {
        keyEvent.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      if (retryFrame !== 0) cancelAnimationFrame(retryFrame)
      document.removeEventListener('keydown', handleKeyDown)
      // 열어 준 버튼이 사라진 뒤라면 되돌릴 자리가 없다
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [ref, active])
}
