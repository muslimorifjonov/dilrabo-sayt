import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'auth', 'dashboard', 'edit', 'present', 'play'];

export default defineConfig({
  build: {
    rollupOptions: { input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])) },
  },
  test: { environment: 'node' },
});
