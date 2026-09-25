import path from "node:path";

import tseslint from "typescript-eslint";
import betterTailwind from "eslint-plugin-better-tailwindcss";

// better-tailwindcss resolves `entryPoint` against cwd, and turbo runs `lint`
// from each package dir, so these must be absolute, not repo-relative.
const entry = (p) => path.join(import.meta.dirname, p);

const rules = {
  "better-tailwindcss/enforce-canonical-classes": "warn",
  "better-tailwindcss/enforce-shorthand-classes": "warn",
  "better-tailwindcss/enforce-consistent-variable-syntax": "warn",
  "better-tailwindcss/no-deprecated-classes": "warn",
  "better-tailwindcss/no-duplicate-classes": "warn",
  "better-tailwindcss/no-unnecessary-whitespace": "warn",
};

const base = {
  files: ["**/*.{ts,tsx,js,jsx}"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  plugins: { "better-tailwindcss": betterTailwind },
  rules,
};

export default [
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"] },
  {
    ...base,
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    settings: {
      "better-tailwindcss": {
        entryPoint: entry("packages/ui/src/styles/globals.css"),
      },
    },
  },
  {
    ...base,
    files: ["apps/docs/**/*.{ts,tsx}"],
    settings: {
      "better-tailwindcss": { entryPoint: entry("apps/docs/app/globals.css") },
    },
  },
];
