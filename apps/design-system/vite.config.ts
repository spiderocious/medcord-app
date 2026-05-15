import { fileURLToPath } from 'node:url';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@app', replacement: path.resolve(__dirname, 'src') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@ui', replacement: path.resolve(__dirname, 'src/ui') },
      { find: '@icons', replacement: path.resolve(__dirname, 'src/shared/icons/index.ts') },
    ],
  },
  server: {
    port: 5175,
    strictPort: false,
  },
});
