/// <reference types="./types.d.ts" />

import eslint from "@eslint/js";
import drizzlePlugin from "eslint-plugin-drizzle";
import importPlugin from "eslint-plugin-import";
import sortKeysFixPlugin from "eslint-plugin-sort-keys-fix";
import turboPlugin from "eslint-plugin-turbo";
import unicornPlugin from "eslint-plugin-unicorn";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

/**
 * All packages that leverage t3-env should use this rule
 */
export const restrictEnvAccess = tseslint.config({
  files: ["**/*.js", "**/*.ts", "**/*.tsx"],
  ignores: ["**/env.ts", "**/*.config.*", "**/_generated/*", "*.config.js"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        importNames: ["env"],
        message:
          "Use `import { env } from '~/env'` instead to ensure validated types.",
        name: "process",
      },
    ],
    "no-restricted-properties": [
      "error",
      {
        message:
          "Use `import { env } from '~/env'` instead to ensure validated types.",
        object: "process",
        property: "env",
      },
    ],
  },
});

export default tseslint.config(
  {
    // Globally ignored files
    ignores: ["**/*.config.*", "**/_generated/*", "*.config.js", "*.config.*"],
  },
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    plugins: {
      drizzle: drizzlePlugin,
      import: importPlugin,
      "sort-keys-fix": sortKeysFixPlugin,
      turbo: turboPlugin,
      unicorn: unicornPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      ...unicornPlugin.configs["flat/recommended"].rules,
      ...drizzlePlugin.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { fixStyle: "separate-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        2,
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: true,
        },
      ],
      // "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "drizzle/enforce-delete-with-where": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "no-unused-vars": "off",
      "sort-keys-fix/sort-keys-fix": "warn",
      "unicorn/no-null": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          allowList: {
            Args: true,
            E2E: true,
            ENV: true,
            Env: true,
            Fn: true,
            PROD: true,
            Param: true,
            Params: true,
            Prod: true,
            Props: true,
            Ref: true,
            args: true,
            db: true,
            e2e: true,
            env: true,
            fn: true,
            getInitialProps: true,
            param: true,
            params: true,
            prod: true,
            props: true,
            ref: true,
            str: true,
          },
        },
      ],
      // or "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    languageOptions: { parserOptions: { projectService: true } },
    linterOptions: { reportUnusedDisableDirectives: true },
  },
);
