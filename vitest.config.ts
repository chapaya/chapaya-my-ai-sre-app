import { configDefaults, defineConfig } from "vitest/config";

// Only test the real source: to_upload/ and android/ hold generated copies.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "to_upload/**", "android/**", "out/**"] },
});
