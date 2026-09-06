// toBeInTheDocument 등 DOM 매처를 vitest 의 expect 에 등록한다
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 테스트 간 DOM 이 새는 것을 막는다
afterEach(() => {
  cleanup()
})

// jsdom 에는 matchMedia 가 없다. useMediaQuery 가 데스크톱으로 동작하도록 채운다.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  })
}
