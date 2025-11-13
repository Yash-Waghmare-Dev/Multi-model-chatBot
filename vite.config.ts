import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://n8n.srv650558.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api\/chat/, '/webhook/3967230f-99b6-4a50-b049-be711b89c3b3'),
      },
    },
  },
})
