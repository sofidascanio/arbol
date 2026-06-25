import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
        '@': resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // desactiva minificacion para facilitar debugging
        minify: false,
        rollupOptions: {
        input: {
            popup: resolve(__dirname, 'index.html'),
            background: resolve(__dirname, 'src/background/background.ts'),
            content: resolve(__dirname, 'src/content/content.ts'),
        },
        output: {
            entryFileNames: (chunk) => {
            if (chunk.name === 'background') return 'background/background.js';
            if (chunk.name === 'content') return 'content/content.js';
            return 'popup/[name].js';
            },
            chunkFileNames: 'chunks/[name]-[hash].js',
            assetFileNames: (asset) => {
            if (asset.name?.endsWith('.css')) return 'popup/[name][extname]';
            return 'assets/[name][extname]';
            },
            // no usar formato ES para background (chrome lo requiere explicito)
            format: 'es',
        },
        },
    },
});