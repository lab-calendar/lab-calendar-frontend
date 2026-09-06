/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // 소스 옆에 *.test.tsx 로 둔다
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // CSS 는 적용하지 않는다. jsdom 은 뷰포트가 고정이라 미디어 쿼리를 태울 수
    // 없고, 스타일을 넣으면 반응형으로 숨긴 요소가 접근성 트리에서 빠져 로직
    // 검증이 막힌다. 레이아웃 검증은 브라우저에서 한다.
    css: false,
    restoreMocks: true,
  },
})
