import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

/** Next.js's recommended rules (React, accessibility basics, Core Web Vitals) plus its TypeScript rules. */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "playwright-report/**", "test-results/**", ".agents/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
