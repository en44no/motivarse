import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'vendor-firebase-fcm': ['firebase/messaging'],
          'vendor-animations': ['framer-motion'],
          'vendor-dates': ['date-fns'],
          'vendor-router': ['react-router-dom'],
          // recharts y react-markdown NO van aquí — solo se usan en lazy chunks
          // y Vite los agrupa automáticamente sin preloadearlos
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Motivarse - Hábitos en Pareja',
        short_name: 'Motivarse',
        description: 'App de hábitos para parejas que quieren mejorar juntos',
        theme_color: '#0f1729',
        background_color: '#0f1729',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Force new SW to activate immediately
        skipWaiting: true,
        clientsClaim: true,
        // NO runtime caching for Firestore — it uses its own protocol
        // Caching Firestore responses was serving stale/empty data
        runtimeCaching: [
          {
            urlPattern: /\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-chunks',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
})
