import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'react-native': 'react-native-web',
    },
  },
  define: {
    'process.env': {},
    global: 'window',
  },
  optimizeDeps: {
    include: ['globe.gl', 'three'],
    esbuildOptions: {
      mainFields: ['module', 'main'],
      resolveExtensions: ['.web.js', '.js', '.ts', '.web.tsx', '.tsx', '.jsx'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          globe: ['globe.gl', 'three'],
        },
      },
    },
  },
});
