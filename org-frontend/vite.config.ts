/// <reference types="vitest" />
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import checker from "vite-plugin-checker"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
  ],
  assetsInclude: ["/sb-preview/runtime.js"],
  server: {
    proxy: {
      // Proxy file requests to the backend in development
      // In production, nginx handles this routing
      "/files": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
})
