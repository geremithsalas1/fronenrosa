import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_URL ? env.VITE_API_URL.replace(/\/$/, '').replace(/\/api$/, '') : 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': backendTarget,
        '/uploads': backendTarget
      }
    }
  }
})
