import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: Die App liegt unter https://def-one.github.io/wg-manager/
// Über VITE_BASE_PATH kann der Pfad überschrieben werden (z. B. "/" für ein eigenes Repo mit eigener Domain).
const base = process.env.VITE_BASE_PATH ?? '/wg-manager/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    // Build landet direkt im veröffentlichten Ordner des Pages-Repos
    outDir: process.env.VITE_OUT_DIR ?? '../wg-manager',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
  },
} as any)
