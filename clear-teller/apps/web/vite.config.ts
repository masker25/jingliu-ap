import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // base is "/" for local/Vercel and "/<repo>/" for GitHub Pages project sites
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // forward API + SSE calls to the FastAPI backend in dev
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
