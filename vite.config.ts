import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['icons/logo1.png', 'screenshots/screenshot12.png'],
      manifest: {
        name: 'ToDo Zero Miedo',
        short_name: 'TDZM',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ed5555',
        icons: [
          {
            src: '/icons/logorcs.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/logo54.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/screenshot12.png',
            sizes: '1366x728',
            type: 'image/png',
            form_factor: 'wide'
          },
        ],
      },
    }),
  ],    
});