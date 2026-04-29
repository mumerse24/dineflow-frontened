import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    // Split large chunks for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, rarely changes
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI & animation libraries
          "vendor-ui": ["framer-motion", "sonner", "lucide-react"],
          // Redux state management
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          // Stripe payment library
          "vendor-stripe": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          // Date/utility libraries
          "vendor-utils": ["date-fns", "axios"],
        },
      },
    },
    // Raise warning threshold so the split chunks don't warn
    chunkSizeWarningLimit: 600,
  },
});
