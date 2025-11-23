import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
      'jsmediatags': 'jsmediatags/dist/jsmediatags.min.js',
    },
  },
  optimizeDeps: {
    include: ['jsmediatags'],
  },
  build: {
    commonjsOptions: {
      include: [/jsmediatags/, /node_modules/],
    },
  }
})
