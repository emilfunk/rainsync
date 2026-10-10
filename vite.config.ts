import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { crx, type ManifestV3Export } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [react(), crx({ manifest: manifest as unknown as ManifestV3Export })],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@shared': resolve(import.meta.dirname, 'src/shared'),
    },
  },
});
