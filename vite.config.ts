/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /*
     * /api 를 백엔드로 넘겨 브라우저에게는 한 출처로 보이게 한다 (KAN-36).
     *
     * 교차 출처로 부르면 세션 쿠키를 주고받는 데 CORS 와 SameSite 조건이 겹쳐
     * 붙는다. 운영에서는 nginx 가 같은 일을 하므로, 개발도 같은 모양으로 맞춰
     * 두는 편이 낫다 — 로컬에서만 되는 설정을 만들지 않는다.
     */
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
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
