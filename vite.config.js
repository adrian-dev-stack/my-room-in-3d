import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'ui-vendor': ['gsap', 'lil-gui', 'stats.js']
        }
      }
    }
  },
  server: {
    host: true,
    open: true
  }
});