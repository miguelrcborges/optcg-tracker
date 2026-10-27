import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Grand Line Ledger',
        short_name: 'Grand Line',
        description: 'Track your One Piece TCG tournament results, matchups, and dice luck.',
        theme_color: '#080d16',
        background_color: '#080d16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/(?:limitlesstcg\.nyc3\.cdn\.digitaloceanspaces\.com\/one-piece\/|optcgapps\.com\/cards\/|tcgplayer-cdn\.tcgplayer\.com\/product\/).*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leader-card-art',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
