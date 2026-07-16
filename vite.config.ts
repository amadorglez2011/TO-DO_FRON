import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Esto le dice a Vite que incluya los assets en el Service Worker automáticamente
      includeAssets: ['src/assets/logo.png', 'src/assets/screenshot1.png'],
      manifest: {
        name: 'ToDo Zero Miedo',
        short_name: 'TDZM',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ed5555',
        icons: [
          {
            src: 'src/assets/logorcs.png', // RUTA REAL de tu proyecto
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'src/assets/logo54.png', // RUTA REAL de tu proyecto
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'src/assets/screenshot1.png', // RUTA REAL de tu proyecto
            sizes: '1366x728',
            type: 'image/png',
            form_factor: 'wide'
          },
        ],
      },
    }),
  ],    
});