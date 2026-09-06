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
    css: true,
    restoreMocks: true,
  },
})
