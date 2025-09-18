import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
})