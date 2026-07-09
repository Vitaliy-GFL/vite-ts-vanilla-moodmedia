import { defineConfig, Plugin, ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

import pck from './package.json';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './src/config/design';

function publicDirReload() {
  return {
    name: 'public-dir-reload',
    configureServer(server: ViteDevServer) {
      server.watcher.add('public/mframe.json');

      server.watcher.on('change', (path: string) => {
        if (path === 'public/mframe.json') {
          server.hot.send({ type: 'full-reload' });
        }
      });
    },
  };
}

// The dev entry is main.html (index.html at the repo root is a temp file used by
// `mtemplate compile`), but the player expects dist/index.html — rename on emit.
function renameHtmlOutput(): Plugin {
  return {
    name: 'rename-html-output',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const asset = bundle['main.html'];
      if (asset) {
        asset.fileName = 'index.html';
      }
    },
  };
}

export default defineConfig({
  plugins: [legacy({ renderModernChunks: false, targets: ['chrome 89'] }), react(), publicDirReload(), renameHtmlOutput()],
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
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `$design-width: ${DESIGN_WIDTH};\n$design-height: ${DESIGN_HEIGHT};\n`,
      },
    },
  },
  // Keep function/class .name intact across transform and minification.
  // The Android player looks up P2P callbacks by function name (see src/services/api/p2p.ts).
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      keep_fnames: true,
      keep_classnames: true,
    },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'main.html'),
      },
    },
  },
});
