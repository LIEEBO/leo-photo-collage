import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// base 路径通过环境变量 VITE_BASE 控制，默认 '/'
// GitHub Pages 部署时设置为 '/<repo-name>/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
