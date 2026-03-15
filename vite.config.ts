import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      { find: "@pages", replacement: path.resolve(__dirname, "src/pages") },
    ],
  },
  server: {
    port: 5174,
    strictPort: true, // 端口被占用时报错而不是自动切换
    proxy: {
      "/uploads": {
        target: "http://127.0.0.1:30000",
        changeOrigin: true,
      },
    },
  },
})
