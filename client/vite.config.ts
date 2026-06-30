import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isTest = process.env.VITE_TEST === "true";
const port = isTest ? 5174 : 5173;
const apiTarget = isTest ? "http://localhost:3001" : "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
