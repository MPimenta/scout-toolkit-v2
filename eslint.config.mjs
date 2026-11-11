import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-e2e*/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Generated or separate projects, not app code.
      "docs/api/**",
      "devlog/**",
      "eminent-eclipse/**",
      ".tmp-brand-assets/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    // CommonJS config files and Node scripts.
    files: ["*.js", "*.config.ts", "scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Test doubles and mocks are loosely typed on purpose.
    files: ["tests/**/*.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;
