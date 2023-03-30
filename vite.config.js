import { defineConfig } from "vite";
import { resolve } from "path";
import { ZBAR_WASM_URL } from "./src/zbarWasmUrl";
import { viteStaticCopy } from "vite-plugin-static-copy";
import replace from "@rollup/plugin-replace";

export default defineConfig({
  resolve: {
    alias: {
      [ZBAR_WASM_URL]: "@undecaf/zbar-wasm",
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "./src/service-worker.ts"),
      formats: ["es"],
      fileName: (_, entryName) => entryName + ".js",
    },
    rollupOptions: {
      output: {
        manualChunks: () => "service-worker.js",
      },
    },
  },
  plugins: [
    replace({
      HTMLImageElement: "ImageData",
      preventAssignment: true,
    }),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@undecaf/zbar-wasm/dist/zbar.wasm",
          dest: "./",
        },
      ],
    }),
  ],
});
