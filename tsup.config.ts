import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: !isDev,
  treeshake: true,
  splitting: false,
  outDir: "dist",
  platform: "browser",
  globalName: "Datanova",
  define: {
    __API_BASE_URL__: isDev
      ? '"http://localhost:3000"'
      : '"https://api.datanova.sh"',
  },
});