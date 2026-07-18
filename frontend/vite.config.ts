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
  // 🟢 PROXY DE PREVIEW: Necesario para que la API responda en producción local
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 🟢 ULTRA-SEGURO: Solo separamos las librerías gigantes que están 100% aisladas.
            // React, Lucide y el resto se quedan en el bundle base. 
            // Esto garantiza CERO advertencias y CERO errores circulares en el navegador.
            if (id.includes('xlsx') || id.includes('excel')) {
              return 'vendor-excel';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('pdf') || id.includes('html2canvas') || id.includes('jspdf') || id.includes('pdfmake')) {
              return 'vendor-pdf';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});