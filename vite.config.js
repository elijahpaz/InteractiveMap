import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /<repo>/, but the dev server serves from /.
// Keying `base` off the command keeps both working without a manual switch.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/InteractiveMap/' : '/',
  plugins: [react()],
  server: { port: 5173 },
}))
