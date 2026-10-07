import { defineConfig } from 'vite';

declare const process: { env: Record<string, string | undefined> };

// GitHub Pages serves project sites from a subdirectory (https://user.github.io/repo/).
// A relative base ('./') makes every asset URL relative to index.html, so the same
// build works from any subdirectory or the domain root. Override with VITE_BASE
// (e.g. VITE_BASE=/pianito/) if you prefer absolute URLs.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  server: { port: 6173 },
  preview: { port: 6173 },
  build: { target: 'es2020', sourcemap: false },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never);
