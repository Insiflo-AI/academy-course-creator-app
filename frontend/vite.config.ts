import crypto from "node:crypto"
import path from "node:path"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// Node 18/20 don't expose crypto.hash; Vite 7 expects it. Add a fallback.
if (!(crypto as any).hash) {
  ;(crypto as any).hash = (algorithm: string, data: string | Uint8Array, encoding: crypto.BinaryToTextEncoding) =>
    crypto.createHash(algorithm).update(data).digest(encoding)
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
