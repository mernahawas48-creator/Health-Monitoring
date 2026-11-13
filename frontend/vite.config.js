import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const proxy = { '/api': 'http://127.0.0.1:8000' };

export default defineConfig({
  server: { proxy, strictPort: true },
  preview: { proxy, strictPort: true },
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'AstroVitalis Crew Health Monitor',
      short_name: 'AstroVitalis',
      description: 'Simulated astronaut health telemetry',
      theme_color: '#090f1c',
      background_color: '#090f1c',
      display: 'standalone',
      icons: [192, 512].map(size => ({
        src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png',
      })),
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png}'],
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [{
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/demo/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'astrovitalis-simulation',
          networkTimeoutSeconds: 3,
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 18, maxAgeSeconds: 604800 },
        },
      }],
    },
  })],
});
