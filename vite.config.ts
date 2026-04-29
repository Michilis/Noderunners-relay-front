import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** Backend for `npm run dev` when `VITE_API_URL` is empty (same-origin `/v1`, etc.). */
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8085';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '^/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '^/.well-known': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '^/healthz': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '^/openapi\\.json': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '^/docs': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
