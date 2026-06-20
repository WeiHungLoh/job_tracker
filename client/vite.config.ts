import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL_LOCAL_HOST || 'http://127.0.0.1:5005',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/index.tsx',
          'src/pages/dashboard/**',
          'src/**/*.d.ts',
          'src/types.ts'
        ],
        thresholds: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: -10
        }
      }
    }
  }
})
