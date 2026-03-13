import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.png'],
      manifest: {
        name: 'SecureChat – Private Messenger',
        short_name: 'SecureChat',
        description: 'End-to-end encrypted real-time messaging',
        theme_color: '#00e5ff',
        background_color: '#040712',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/chat',
        scope: '/',
        icons: [
          {
            src: '/icon-512.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Open Chats',
            short_name: 'Chats',
            url: '/chat',
            icons: [{ src: '/icon-512.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Cache static assets (JS, CSS, images) on first load
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Network-first for API calls so we always get fresh data when online
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          }
        ]
      },
      devOptions: {
        // Enable service worker in dev mode for testing
        enabled: false
      }
    })
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          libs: ['node-forge', '@stomp/stompjs', 'sockjs-client', 'axios'],
        }
      }
    }
  },
  server: {
    historyApiFallback: true,
  }
})

