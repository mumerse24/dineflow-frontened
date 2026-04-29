// vite.config.js
import { defineConfig } from "file:///C:/food-delivery-App/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/food-delivery-App/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/food-delivery-App/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\food-delivery-App\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // ✅ DEV SERVER — faster hot reload
  server: {
    hmr: true,
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"]
    }
  },
  // ✅ PRODUCTION BUILD — minify + split chunks
  build: {
    minify: "terser",
    // stronger than default esbuild minify
    terserOptions: {
      compress: {
        drop_console: true,
        // removes all console.log in production
        drop_debugger: true
        // removes debugger statements
      }
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // splits vendor libraries into separate cached chunks
          "react-vendor": ["react", "react-dom"],
          "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
          "router-vendor": ["react-router-dom"]
        }
      }
    }
  },
  // ✅ DEPENDENCIES — pre-bundle heavy packages
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@reduxjs/toolkit",
      "react-redux",
      "axios"
    ],
    esbuildOptions: {
      target: "esnext"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxmb29kLWRlbGl2ZXJ5LUFwcFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcZm9vZC1kZWxpdmVyeS1BcHBcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2Zvb2QtZGVsaXZlcnktQXBwL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gIF0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuXG4gIC8vIFx1MjcwNSBERVYgU0VSVkVSIFx1MjAxNCBmYXN0ZXIgaG90IHJlbG9hZFxuICBzZXJ2ZXI6IHtcbiAgICBobXI6IHRydWUsXG4gICAgd2FybXVwOiB7XG4gICAgICBjbGllbnRGaWxlczogW1wiLi9zcmMvbWFpbi50c3hcIiwgXCIuL3NyYy9BcHAudHN4XCJdLFxuICAgIH0sXG4gIH0sXG5cbiAgLy8gXHUyNzA1IFBST0RVQ1RJT04gQlVJTEQgXHUyMDE0IG1pbmlmeSArIHNwbGl0IGNodW5rc1xuICBidWlsZDoge1xuICAgIG1pbmlmeTogXCJ0ZXJzZXJcIiwgICAgICAgICAgIC8vIHN0cm9uZ2VyIHRoYW4gZGVmYXVsdCBlc2J1aWxkIG1pbmlmeVxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgICAgIC8vIHJlbW92ZXMgYWxsIGNvbnNvbGUubG9nIGluIHByb2R1Y3Rpb25cbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSwgICAgLy8gcmVtb3ZlcyBkZWJ1Z2dlciBzdGF0ZW1lbnRzXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIHNwbGl0cyB2ZW5kb3IgbGlicmFyaWVzIGludG8gc2VwYXJhdGUgY2FjaGVkIGNodW5rc1xuICAgICAgICAgIFwicmVhY3QtdmVuZG9yXCI6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgICAgICAgIFwicmVkdXgtdmVuZG9yXCI6IFtcIkByZWR1eGpzL3Rvb2xraXRcIiwgXCJyZWFjdC1yZWR1eFwiXSxcbiAgICAgICAgICBcInJvdXRlci12ZW5kb3JcIjogW1wicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcblxuICAvLyBcdTI3MDUgREVQRU5ERU5DSUVTIFx1MjAxNCBwcmUtYnVuZGxlIGhlYXZ5IHBhY2thZ2VzXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgIFwicmVhY3RcIixcbiAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgIFwiQHJlZHV4anMvdG9vbGtpdFwiLFxuICAgICAgXCJyZWFjdC1yZWR1eFwiLFxuICAgICAgXCJheGlvc1wiLFxuICAgIF0sXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStRLFNBQVMsb0JBQW9CO0FBQzVTLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsUUFBUTtBQUFBLElBQ04sS0FBSztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sYUFBYSxDQUFDLGtCQUFrQixlQUFlO0FBQUEsSUFDakQ7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBO0FBQUEsUUFDZCxlQUFlO0FBQUE7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDckMsZ0JBQWdCLENBQUMsb0JBQW9CLGFBQWE7QUFBQSxVQUNsRCxpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
