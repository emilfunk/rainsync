import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webExtension from '@samrum/vite-plugin-web-extension';
import manifestJson from './public/manifest.json';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: manifestJson as any,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
