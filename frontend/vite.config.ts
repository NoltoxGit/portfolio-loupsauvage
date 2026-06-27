import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const phpDevServer = "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: phpDevServer,
        changeOrigin: true,
      },
      "/uploads": {
        target: phpDevServer,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
