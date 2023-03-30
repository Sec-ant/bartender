import { defineConfig } from "vite";
import { resolve } from "path";
import { ZBAR_WASM_URL } from "./src/zbarWasmUrl";
import replace from "@rollup/plugin-replace";

export default defineConfig({
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
      external: [ZBAR_WASM_URL],
    },
  },
  plugins: [
    replace({
      HTMLImageElement: "ImageData",
      preventAssignment: true,
    }),
  ],
});
