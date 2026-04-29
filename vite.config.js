import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ DEV SERVER — faster hot reload
  server: {
    hmr: true,
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },

  // ✅ PRODUCTION BUILD — minify + split chunks
  build: {
    minify: "terser",           // stronger than default esbuild minify
    terserOptions: {
      compress: {
        drop_console: true,     // removes all console.log in production
        drop_debugger: true,    // removes debugger statements
      },
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // splits vendor libraries into separate cached chunks
          "react-vendor": ["react", "react-dom"],
          "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
          "router-vendor": ["react-router-dom"],
        },
      },
    },
  },

  // ✅ DEPENDENCIES — pre-bundle heavy packages
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@reduxjs/toolkit",
      "react-redux",
      "axios",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
});
