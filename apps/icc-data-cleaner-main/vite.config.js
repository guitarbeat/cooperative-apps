import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite configuration for ICC Data Cleaner React application
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Use the automatic JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    // Enable CORS for development
    cors: true,
    // Configure HMR (Hot Module Replacement)
    hmr: {
      overlay: true,
    },
  },

  // Build configuration
  build: {
    // Output directory for production builds
    outDir: 'dist',
    // Generate source maps for better debugging
    sourcemap: true,
    // Optimize bundle size
    minify: 'terser',
    // Configure chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          vendor: ['react', 'react-dom'],
          xlsx: ['xlsx'],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Path resolution
  resolve: {
    alias: {
      // Enable absolute imports from src directory
      '@': resolve(__dirname, 'src'),
    },
  },

  // CSS configuration
  css: {
    // Enable CSS source maps in development
    devSourcemap: true,
    // PostCSS configuration for Tailwind CSS
    postcss: './postcss.config.js',
  },

  // Environment variables
  define: {
    // Define global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server startup
    include: ['react', 'react-dom', 'xlsx'],
    // Exclude these from pre-bundling
    exclude: [],
  },
});
