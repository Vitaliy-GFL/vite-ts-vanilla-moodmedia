import { defineConfig, ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

import pck from './package.json';

// A custom plugin to force a full reload for mframe.json changes
function publicDirReload() {
  return {
    name: 'public-dir-reload',
    configureServer(server: ViteDevServer) {
      server.watcher.add('public/mframe.json'); // Watch mframe.json file

      server.watcher.on('change', (path: string) => {
        if (path === 'public/mframe.json') {
          server.hot.send({ type: 'full-reload' }); // Send full-reload event
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [legacy({ renderModernChunks: false, targets: ['chrome 50'] }), react(), publicDirReload()],
  define: {
    __APP_VERSION__: `"${pck.version}"`,
  },
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
        index: resolve(__dirname, 'main.html'),
      },
    },
  },
});
