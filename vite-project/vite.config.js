import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Pre-bundle these so Vite can resolve y-protocols subpath exports correctly
    include: [
      'y-protocols/awareness',
      'y-protocols/sync',
      'yjs',
      'y-monaco',
    ],
  },
  build: {
    // Split heavy dependencies into separate lazy chunks.
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco': ['@monaco-editor/react'],
          // y-protocols intentionally omitted — it only has subpath exports
          'yjs':    ['yjs', 'y-monaco'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

