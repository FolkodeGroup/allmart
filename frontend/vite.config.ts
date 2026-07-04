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
        // División dinámica de chunks para evitar dependencias circulares
        manualChunks(id) {
          // 1. Dependencias externas (node_modules)
          if (id.includes('node_modules')) {
            // 🟢 SOLUCIÓN CIRCULAR: Combinamos react, mui, emotion, framer-motion, recharts y d3 en 'vendor-base'
            // Esto elimina la referencia circular entre el módulo de gráficos y las librerías de UI base.
            if (
              id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/') ||
              id.includes('@mui/') || id.includes('@emotion/') || id.includes('framer-motion/') ||
              id.includes('recharts/') || id.includes('d3-')
            ) {
              return 'vendor-base';
            }
            if (id.includes('react-hook-form/') || id.includes('@hookform/resolvers/') || id.includes('zod/')) {
              return 'vendor-forms';
            }
          }

          // 2. Agrupar todas las características de administración en un solo bloque 'admin-core'.
          if (id.includes('src/features/admin/')) {
            return 'admin-core';
          }
        }
      },
    },
    // 🟢 OPTIMIZACIÓN: Aumentamos el límite de advertencia para acomodar el bloque base consolidado y el admin core
    chunkSizeWarningLimit: 1600,
    minify: 'esbuild',
  },
  // Optimization for development
  ssr: {
    noExternal: ['recharts'], // Ensure recharts is bundled
  },
})