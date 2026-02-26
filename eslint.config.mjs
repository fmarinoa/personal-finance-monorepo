import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import pluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const extedsBase = [js.configs.recommended, tseslint.configs.recommended];

const rulesBase = {
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
};

export default defineConfig(
  {
    ignores: [
      "**/node_modules",
      "**/build",
      "**/dist",
      "**/coverage",
      "cdk.out",
    ],
  },
  {
    files: ["apps/backend/**/*.ts", "packages/**/*.ts", "apps/infra/**/*.ts"],
    extends: [...extedsBase],
    plugins: {
      import: pluginImport,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      ...rulesBase,
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    extends: [...extedsBase],
    plugins: {
      import: pluginImport,
      "simple-import-sort": simpleImportSort,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: { ...rulesBase },
  },
);
