import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Hoola/',
  plugins: [react()],
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT ?? '4173')
  },
  build: {
    target: 'es2019'
  }
});
