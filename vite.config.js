import { defineConfig } from "vite";
import { buildPlugin } from "vite-plugin-build";
import { packages } from "./package-lock.json";

export default defineConfig({
  /*
  build: {
    lib: {
      entry: {
        "service-worker": "./src/service-worker.ts",
        "content-script": "./src/content-script.ts",
      },
      formats: ["es", "iife"],
    },
  },
  */
  plugins: [
    buildPlugin({
      fileBuild: false,
      libBuild: {
        buildOptions: [
          {
            lib: {
              entry: { "service-worker": "./src/service-worker.ts" },
              formats: ["es"],
              fileName: (_, entryName) => entryName + ".js",
            },
          },
          {
            lib: {
              entry: {
                "content-script": "./src/content-script.ts",
              },
              name: "bartender",
              formats: ["iife"],
              fileName: (_, entryName) => entryName + ".js",
            },
          },
        ],
      },
    }),
  ],
  define: {
    __RESVG_WASM_VERSION__: JSON.stringify(
      packages["node_modules/@resvg/resvg-wasm"].version
    ),
  },
});
