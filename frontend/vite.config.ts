import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@emotion/react', '@emotion/styled', 'framer-motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],

          // Admin feature chunks for better lazy loading
          'admin-products': [
            './src/features/admin/products/AdminProducts',
            './src/features/admin/products/AdminProductCard',
            './src/features/admin/products/AdminProductFormPage',
          ],
          'admin-categories': ['./src/features/admin/categories/AdminCategories'],
          'admin-orders': ['./src/features/admin/orders/AdminOrders'],
          'admin-images': ['./src/features/admin/images/AdminImages'],
          'admin-variants': ['./src/features/admin/variants/AdminVariants'],
          'admin-reports': ['./src/features/admin/reports/AdminReports'],
        },
      },
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
  },
  // Optimization for development
  ssr: {
    noExternal: ['recharts'], // Ensure recharts is bundled
  },
})
