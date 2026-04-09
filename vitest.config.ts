import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      sqlite: 'node:sqlite'
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
