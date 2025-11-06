import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: '/',
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://api.zarinka.uz',
          changeOrigin: true,
          secure: true,
        },
        '/uploads': {
          target: env.VITE_API_URL || 'https://api.zarinka.uz',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
    // ✅ Explicitly define env variables for client
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})