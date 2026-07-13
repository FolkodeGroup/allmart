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
  build: {
    // Enable code splitting for better caching and lazy loading
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Si la dependencia viene de node_modules
          if (id.includes('node_modules')) {
            // Aislamos la librería de Excel que es enorme
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            // Aislamos las librerías de gráficos para que no pesen en el core
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // El resto de las librerías comunes (React, etc.)
            return 'vendor-base';
          }
        },
      },
    },
    // Podés subir el límite de advertencia si considerás que tu admin tolera chunks más pesados
    chunkSizeWarningLimit: 1000, 
  },
  // Optimization for development
  ssr: {
    noExternal: ['recharts'], // Ensure recharts is bundled
  },
})