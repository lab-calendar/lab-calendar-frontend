import { renderHook } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useContainerWidthChange } from './useContainerWidthChange'

/**
 * 감싼 칸의 폭 변화를 알리는 훅 (KAN-92).
 *
 * jsdom 에는 `ResizeObserver` 가 없고, 있는 브라우저에서도 통지는 배치 뒤·그리기 전에
 * 온다. 그래서 관찰기를 대역으로 세우고 통지를 직접 넣어 배선만 확인한다 — 무엇이
 * 걸러지고 무엇이 지나가는지가 이 훅이 지는 책임의 전부다.
 */
describe('useContainerWidthChange', () => {
  let callbacks: ResizeObserverCallback[]
  let observed: Element[]
  let disconnected: number

  beforeEach(() => {
    callbacks = []
    observed = []
    disconnected = 0

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          callbacks.push(callback)
        }
        observe(element: Element) {
          observed.push(element)
        }
        disconnect() {
          disconnected += 1
        }
        unobserve() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** 관찰기가 주는 통지 하나를 흉내 낸다. 폭 말고는 쓰지 않는다. */
  const notify = (width: number, height = 500) => {
    const entry = { contentRect: { width, height } } as ResizeObserverEntry
    callbacks[0]([entry], {} as ResizeObserver)
  }

  const mount = (onChange: () => void) => {
    // 훅이 보는 것은 ref 안의 요소뿐이라, 붙이지 않은 요소로 충분하다
    const ref = createRef<HTMLElement>() as { current: HTMLElement | null }
    ref.current = document.createElement('div')
    const view = renderHook(() => useContainerWidthChange(ref, onChange))
    return { ref, view }
  }

  it('폭이 달라지면 알린다', () => {
    const onChange = vi.fn()
    mount(onChange)

    notify(1000)
    notify(1300)

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('붙자마자 오는 첫 통지는 변화가 아니다', () => {
    const onChange = vi.fn()
    mount(onChange)

    // 관찰을 걸면 지금 크기를 한 번 알려 준다. 그것까지 변화로 치면 첫 그림 직후에
    // 한 번씩 다시 재게 된다.
    notify(1000)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('폭이 그대로면 알리지 않는다', () => {
    const onChange = vi.fn()
    mount(onChange)

    notify(1000)
    notify(1000, 700)
    notify(1000, 200)

    // 높이만 흔들리는 동안 다시 재면 이득 없이 배치만 흔든다
    expect(onChange).not.toHaveBeenCalled()
  })

  it('접히는 동안 프레임마다 오는 통지를 그대로 받는다', () => {
    const onChange = vi.fn()
    mount(onChange)

    notify(1038)
    for (const width of [1100, 1180, 1260, 1358]) notify(width)

    // 애니메이션 중간 값마다 다시 재야 달력이 따라 움직인다
    expect(onChange).toHaveBeenCalledTimes(4)
  })

  it('떼어 낼 때 관찰을 끊는다', () => {
    const { view } = mount(vi.fn())
    expect(observed).toHaveLength(1)

    view.unmount()

    expect(disconnected).toBe(1)
  })

  it('관찰기가 없는 환경에서는 조용히 넘어간다', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const onChange = vi.fn()

    expect(() => mount(onChange)).not.toThrow()
    expect(onChange).not.toHaveBeenCalled()
  })
})
