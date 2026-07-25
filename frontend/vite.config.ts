// frontend/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pre-bundlea dependencias pesadas para acelerar la primera carga en desarrollo
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'recharts',
      'lucide-react',
      'react-hot-toast',
    ],
  },
  server: {
    // Pre-transforma los archivos de entrada más comunes al iniciar el servidor
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/layout/RootLayout/RootLayout.tsx',
        './src/pages/Home/HomePage.tsx',
      ],
    },
    watch: {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/.vite/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/docs/**',
        '**/.cache/**',
        '**/allmart@0.0.0/**'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // PROXY DE PREVIEW: Necesario para que la API responda en producción local
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    // 🟢 OPTIMIZACIÓN EXTREMA: Dejamos que Rollup maneje los chunks automáticamente.
    // Al remover manualChunks personalizado, se evita que las librerías dinámicas se precarguen en la Home.
    chunkSizeWarningLimit: 1500,
  },
});