const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2021
      },
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-unused-vars": "off"
    }
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "prisma.config.ts",
      "src/index.js",
      "prisma/**/*",
      "migrations/**/*",
      "docs/**/*",
      ".vite/",
      "build/",
      "*.agent.md",
      "ask.agent.md",
      "explore.agent.md",
      "plan.agent.md",
      "vscode.agent.md",
      ".copilot/**/*",
      ".aider*",
      "**/*.chat"
    ]
  }
]);
