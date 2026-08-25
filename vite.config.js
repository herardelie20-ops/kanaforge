import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/kanaforge/' : '/',
  plugins: [sites()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
