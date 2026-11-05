import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon.ico', 
            'apple-touch-icon.png', 
            'pwa-192x192.png', 
            'pwa-512x512.png', 
            'pwa-maskable-512x512.png', 
            'icon.svg', 
            'logo.png'
          ],
          workbox: {
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6MB
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          manifest: {
            id: '/',
            name: 'Stylo Urbano - Gestão de Studio',
            short_name: 'StyloUrbano',
            description: 'Sistema completo de gestão para studios de dança e bem-estar. Controle de alunos, agenda, financeiro e muito mais.',
            theme_color: '#FF6B00',
            background_color: '#121212',
            display: 'standalone',
            orientation: 'any',
            scope: '/',
            start_url: '/',
            lang: 'pt-BR',
            dir: 'ltr',
            categories: ['productivity', 'business', 'fitness'],
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Agenda Semanal',
                short_name: 'Agenda',
                description: 'Ver cronograma de aulas',
                url: '/#calendar',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Lista de Alunos',
                short_name: 'Alunos',
                description: 'Gerenciar alunos cadastrados',
                url: '/#students',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          },
        })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
