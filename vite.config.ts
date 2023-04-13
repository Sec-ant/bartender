import { defineConfig } from "vite";
import { buildPlugin } from "vite-plugin-build";
import { packages } from "./package-lock.json";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    buildPlugin({
      fileBuild: false,
      libBuild: {
        buildOptions: [
          {
            lib: {
              entry: { offscreen: "./src/offscreen/index.ts" },
              formats: ["es"],
              fileName: (_, entryName) => entryName + ".js",
            },
          },
          {
            lib: {
              entry: { options: "./src/options/index.tsx" },
              formats: ["es"],
              fileName: (_, entryName) => entryName + ".js",
            },
          },
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
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": process.env,
    __RESVG_WASM_VERSION__: JSON.stringify(
      packages["node_modules/@resvg/resvg-wasm"].version
    ),
  },
});
