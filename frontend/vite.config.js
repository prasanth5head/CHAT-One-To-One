import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generate source maps for error tracking in production
    sourcemap: false,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split MUI into its own chunk
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Split react core
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split crypto/socket
          libs: ['node-forge', '@stomp/stompjs', 'sockjs-client', 'axios'],
        }
      }
    }
  },
  // Needed when deployed on Render static site with client-side routing
  server: {
    historyApiFallback: true,
  }
})
