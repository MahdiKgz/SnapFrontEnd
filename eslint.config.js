import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js"],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    ...eslintReact.configs["recommended-typescript"],
  },

  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
      prettier,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      // Prettier owns deterministic import ordering. Running two import sorters caused circular
      // autofixes, while the FSD checker below the lint command enforces dependency direction.
      "import/order": "off",
      "import/no-cycle": "error",

      "prettier/prettier": "error",
    },
  },

  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "@eslint-react/no-create-ref": "off",
    },
  },

  prettierConfig,
);
