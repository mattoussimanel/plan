import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base relatif : fonctionne sur GitHub Pages (/plan/) comme en local
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
})
