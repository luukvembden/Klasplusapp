import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Maakt bij elke build de app-iconen (192, 512, maskable, Apple, favicon) uit public/icoon.svg (het K+-logo).
// Overal padding 0: het logo heeft zelf al een groen vlak tot aan de rand, dus geen doorzichtige rand eromheen.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#2E6B5A' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#2E6B5A' } },
  },
  images: ['public/icoon.svg'],
});
