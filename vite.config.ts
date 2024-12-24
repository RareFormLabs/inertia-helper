import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, "index.ts"),
      name: "InertiaHelper",
      fileName: (format) => `inertia-helper.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["@inertiajs/vue3"],
      output: {
        globals: {
          "@inertiajs/vue3": "Inertia",
        },
      },
    },
  },
});
