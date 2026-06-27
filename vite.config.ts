import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins:
   [react(),
   VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'ToDo Zero Miedo',
      short_name: 'TDZM',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ed5555',
      icons: [
        {
          src: '../src/assets/logo.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '../src/assets/logo.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      screenshots: [
        {
          src: '/assets/screenshot1.png',
          sizes: '1280x720',
          type: 'image/png'
        },
      ],
    },
    developmentOptions: {
  enabled: true,
},
}),

],    
});
