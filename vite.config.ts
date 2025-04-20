import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // This prevents Vite from trying alternative ports if 5173 is in use
    watch: {
      // ignore your virtualenv, .git, logs, etc.
      ignored: [
        '**/.venv/**',
        '**/node_modules/**',
        '**/.git/**'
      ]
    }
  }
})
