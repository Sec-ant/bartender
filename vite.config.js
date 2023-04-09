import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        "service-worker": "./src/service-worker.ts",
        "content-script": "./src/content-script.ts",
      },
      formats: ["es"],
    },
  },
});
