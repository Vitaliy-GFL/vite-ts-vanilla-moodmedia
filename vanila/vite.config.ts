// vite.config.js
import legacy from '@vitejs/plugin-legacy';
import eslint from 'vite-plugin-eslint';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [eslint(), legacy({ renderModernChunks: false, targets: ['chrome 50'] })],
	base: "./",
	resolve: {
		alias: {
			"@": __dirname + "/src",
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
