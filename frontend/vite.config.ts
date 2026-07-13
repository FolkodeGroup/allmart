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
          if (id.includes('node_modules')) {
            // 1. Planillas de cálculo (SheetJS / xlsx)
            if (id.includes('xlsx') || id.includes('excel')) {
              return 'vendor-excel';
            }
            // 2. Gráficos (Recharts / D3)
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // 3. Generación de PDFs e imágenes al vuelo (jspdf, html2canvas, pdfmake, etc.)
            if (
              id.includes('pdf') || 
              id.includes('html2canvas') || 
              id.includes('jspdf') || 
              id.includes('pdfmake')
            ) {
              return 'vendor-pdf';
            }
            // 4. React Core (React, ReactDOM, Router, etc.)
            if (id.includes('react') || id.includes('scheduler') || id.includes('router')) {
              return 'vendor-react';
            }
            // 5. Íconos (Lucide y afines)
            if (id.includes('lucide') || id.includes('icons')) {
              return 'vendor-icons';
            }
            // 6. El resto de las librerías utilitarias más livianas
            return 'vendor-base';
          }
        },
      },
    },
    // Subimos el límite del warning a 1500 kB (1.5 MB), ya que para paneles de administración 
    // complejos es un número súper normal y saludable una vez segmentado.
    chunkSizeWarningLimit: 1500,
  },
});