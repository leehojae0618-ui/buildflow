import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
      // Mirrors tsconfig's "@/*" -> "./src/*". Next.js applies that mapping at
      // build time, so modules using it only failed to resolve under Vitest —
      // which went unnoticed while every test that reached them mocked them out.
      "@": path.resolve(__dirname, "src"),
    },
  },
});
