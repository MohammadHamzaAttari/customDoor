import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: "./client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own chunk (~700KB) - loaded ONLY when needed
          "three-core": ["three"],
          "three-react": ["@react-three/fiber", "@react-three/drei"],
          // React core - small, cached well
          "react-vendor": ["react", "react-dom"],
          // UI components - loaded with page
          "radix-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tooltip",
          ],
          // State & data
          "state-vendor": ["zustand", "@tanstack/react-query", "wouter"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    // DON'T pre-bundle Three.js - let it lazy load
    exclude: [],
  },
});