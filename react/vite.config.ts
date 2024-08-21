import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    legacy({ renderModernChunks: false, targets: ['chrome 50'] }),
    react(),
  ],
  base: './',
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
  server: {
    port: 3000,
    open: 'main.html',
  },
  build: {
    sourcemap: true, // for easier debugging on devices
    rollupOptions: {
      input: {
        index: new URL('./main.html', import.meta.url).pathname,
      },
    },
  },
});
