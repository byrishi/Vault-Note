import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // --- Sanitized by open-source packaging script: GEMINI/other vendor API keys removed ---
  // Do NOT inject private vendor API keys into client builds. If you need optional cloud integrations,
  // document how to configure them in a local-only .env and gate usage behind runtime checks.
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
