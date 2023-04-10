import { defineConfig } from "vite";
import { buildPlugin } from "vite-plugin-build";
import { packages } from "./package-lock.json";

export default defineConfig({
  plugins: [
    buildPlugin({
      fileBuild: false,
      libBuild: {
        buildOptions: [
          {
            lib: {
              entry: { "service-worker": "./src/service-worker/index.ts" },
              formats: ["es"],
              fileName: (_, entryName) => entryName + ".js",
            },
          },
          {
            lib: {
              entry: {
                "content-script": "./src/content-script/index.ts",
              },
              formats: ["iife"],
              name: "Bartender",
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
