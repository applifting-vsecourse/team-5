import react from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves tsconfig `paths` (the `@/` alias) natively.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    env: {
      VITE_API_URL: "http://localhost:3000/api",
      VITE_BETTER_AUTH_URL: "http://localhost:3000/api/auth",
    },
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
})
