import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' houdt paden relatief, zodat dezelfde build later ook in Capacitor werkt.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Zelf registreren in main.tsx: alleen op de website, niet in de telefoon-app.
      injectRegister: false,
      // Iconen komen uit pwa-assets.config.ts.
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Klas+',
        short_name: 'Klas+',
        description: 'Je rooster, cijfers en huiswerk in één rustig overzicht.',
        lang: 'nl',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2E6B5A',
        background_color: '#F4F5F1',
      },
      workbox: {
        // De hele app (HTML, JS, CSS, lettertype, iconen) staat na het eerste bezoek offline klaar.
        globPatterns: ['**/*.{html,js,css,woff2,svg,png,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
