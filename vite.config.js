import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  // Les builds locaux sont également servis par Electron via file://. Des
  // chemins relatifs garantissent que les images, styles et animations soient
  // présents au lancement direct ; GitHub Pages conserve son préfixe dédié.
  base: process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/kanaforge/' : './'),
  plugins: [sites()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        kanaforge: resolve(import.meta.dirname, 'index.html'),
        studio: resolve(import.meta.dirname, 'studio.html'),
        object3d: resolve(import.meta.dirname, 'object3d.html'),
      },
    },
  },
});
