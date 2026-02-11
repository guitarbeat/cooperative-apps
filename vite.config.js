import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { componentTagger } from "lovable-tagger"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  server: {
    host: '::',
    port: 8080,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true
  }
}))
