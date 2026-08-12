import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
	// Keep production assets rooted at the site origin so client-side routes such
	// as /trips do not incorrectly request /trips/assets/* after a page refresh.
	base: '/',
	envDir: '.',
	server: {
		port: 5200,
		strictPort: true,
	},
	plugins: [
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
