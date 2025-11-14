// Fix: The triple-slash directive `/// <reference types="vitest" />` was removed as it is not needed when using `defineConfig` from `vitest/config` and was causing a type resolution issue.
// Fix: Import defineConfig from 'vitest/config' instead of 'vite' to get the correct types for the test config.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    // You can specify a glob pattern to find your test files
    include: ['**/*.test.tsx', '**/*.test.ts'],
  },
});