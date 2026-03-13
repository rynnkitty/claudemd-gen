import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/frontend/vite.config.ts',
  'packages/backend/vitest.config.ts',
  'packages/shared/vitest.config.ts',
]);
