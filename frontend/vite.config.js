import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	envDir: '..',
	server: {
		port: 5200,
		strictPort: true,
	},
	plugins: [
		react(),
		tailwindcss(),
	],
});