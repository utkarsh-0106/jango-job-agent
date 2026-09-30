import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';

function movePopupHtml() {
  return {
    name: 'move-popup-html',
    writeBundle() {
      const src = resolve(__dirname, 'dist/src/popup/index.html');
      const destDir = resolve(__dirname, 'dist/popup');
      const dest = resolve(destDir, 'index.html');
      
      if (existsSync(src)) {
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        copyFileSync(src, dest);
        // Clean up the src/popup directory
        rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), movePopupHtml()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') return 'popup/[name].js';
          return '[name].js';
        },
        chunkFileNames: 'popup/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') return 'popup/[name].[ext]';
          if (assetInfo.name?.endsWith('.css')) return 'popup/[name].[ext]';
          return '[name].[ext]';
        },
      },
    },
  },
  publicDir: 'public',
});