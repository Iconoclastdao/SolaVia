import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path from "path";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, "node_modules/buffer/"),
      process: path.resolve(__dirname, "node_modules/process/browser.js"),
      util: path.resolve(__dirname, "node_modules/util/"),
      stream: path.resolve(__dirname, "node_modules/stream-browserify/"),
      crypto: path.resolve(__dirname, "node_modules/crypto-browserify/"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "stream",
      "util",
      "crypto",
      "@ethereumjs/vm",
      "@ethereumjs/tx",
      "@ethereumjs/common",
      "ethereumjs-util",
      "bn.js",
      "keccak",
    ],
  },
  server: {
    proxy: {
      "/api/ollama1": {
        target: "http://127.0.0.1:11434",
        changeOrigin: true,
        rewrite: (urlPath) => urlPath.replace(/^\/api\/ollama1/, "/api"),
      },
      "/api/ollama2": {
        target: "http://127.0.0.1:11435",
        changeOrigin: true,
        rewrite: (urlPath) => urlPath.replace(/^\/api\/ollama2/, "/api"),
      },
      "/api/ollama3": {
        target: "http://127.0.0.1:11437",
        changeOrigin: true,
        rewrite: (urlPath) => urlPath.replace(/^\/api\/ollama3/, "/api"),
      },
    },
  },
});