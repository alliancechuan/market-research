import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// 相对路径：本地 preview 与 GitHub Pages 均可
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "cursor/canvas": path.resolve(rootDir, "src/shims/cursor-canvas.tsx"),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
});
