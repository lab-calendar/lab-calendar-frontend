// toBeInTheDocument 등 DOM 매처를 vitest 의 expect 에 등록한다
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 테스트 간 DOM 이 새는 것을 막는다
afterEach(() => {
  cleanup()
})

// jsdom(29 기준)은 dialog.showModal/close 를 구현하지 않는다.
// 열림 상태만 흉내 낸다. 포커스 트랩과 ESC 는 브라우저가 처리하므로 여기서 검증하지 않는다.
if (
  typeof HTMLDialogElement !== 'undefined' &&
  !HTMLDialogElement.prototype.showModal
) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close() {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

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
