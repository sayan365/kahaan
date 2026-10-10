import { defineConfig } from 'vite';
export default defineConfig({ server: { port: 5173, proxy: { '/api': { target: 'http://127.0.0.1:3001', rewrite: p => p.replace(/^\/api/, '') } } }, build: { rollupOptions: { output: { manualChunks: { auth: ['aws-amplify', 'aws-amplify/auth'], map: ['leaflet', 'react-leaflet'] } } } } });
