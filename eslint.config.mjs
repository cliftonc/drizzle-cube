import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["**/dist/**", "**/.eslintrc.cjs", "**/node_modules/**"]
  },
  js.configs.recommended,
  // React hooks rules for client components
  {
    files: ["src/client/**/*.tsx", "src/client/**/*.ts"],
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  // Client component rules: i18n bare strings + theming color enforcement
  {
    files: ["src/client/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXElement > JSXText[value=/[A-Z][a-z]{2,}/]",
          message: "Bare text in JSX — use t() from i18n/runtime for translatable strings."
        },
        {
          selector: "Literal[value=/\\b(text|bg|border|ring|from|to|via|fill|stroke|outline|shadow|accent|caret|divide|placeholder|decoration)-(red|green|blue|yellow|orange|purple|pink|indigo|teal|cyan|emerald|lime|amber|violet|fuchsia|rose|sky|slate|gray|zinc|neutral|stone)-\\d{2,3}\\b/]",
          message: "Use dc- prefixed theme variables instead of raw Tailwind colors. See .claude/rules/theming.md for mappings."
        },
        {
          selector: "TemplateElement[value.raw=/\\b(text|bg|border|ring|from|to|via|fill|stroke|outline|shadow|accent|caret|divide|placeholder|decoration)-(red|green|blue|yellow|orange|purple|pink|indigo|teal|cyan|emerald|lime|amber|violet|fuchsia|rose|sky|slate|gray|zinc|neutral|stone)-\\d{2,3}\\b/]",
          message: "Use dc- prefixed theme variables instead of raw Tailwind colors. See .claude/rules/theming.md for mappings."
        }
      ]
    }
  },
  // Server i18n — flag bare strings in user-facing validation/error code
  // Scoped to files that produce API responses, not internal adapters/executors
  {
    files: [
      "src/server/compiler.ts",
      "src/server/executor.ts",
      "src/server/builders/funnel-query-builder.ts",
      "src/server/builders/flow-query-builder.ts",
      "src/server/builders/retention-query-builder.ts",
      "src/server/ai/validation.ts",
      "src/server/agent/chart-validation.ts",
      "src/server/agent/handler.ts",
      "src/server/template-substitution.ts",
      "src/server/logical-plan/logical-plan-builder.ts",
      "src/server/logical-plan/logical-planner.ts"
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.object.name='errors'][callee.property.name='push'] > Literal:first-child",
          message: "Bare string in errors.push() — use t() from i18n/runtime for translatable messages."
        },
        {
          selector: "CallExpression[callee.object.name='errors'][callee.property.name='push'] > TemplateLiteral:first-child",
          message: "Bare template literal in errors.push() — use t() from i18n/runtime for translatable messages."
        },
        {
          selector: "CallExpression[callee.object.name='warnings'][callee.property.name='push'] > Literal:first-child",
          message: "Bare string in warnings.push() — use t() from i18n/runtime for translatable messages."
        },
        {
          selector: "CallExpression[callee.object.name='warnings'][callee.property.name='push'] > TemplateLiteral:first-child",
          message: "Bare template literal in warnings.push() — use t() from i18n/runtime for translatable messages."
        },
        {
          selector: "NewExpression[callee.name='Error'] > Literal:first-child",
          message: "Bare string in new Error() — use t() from i18n/runtime for translatable messages."
        },
        {
          selector: "NewExpression[callee.name='Error'] > TemplateLiteral:first-child",
          message: "Bare template literal in new Error() — use t() from i18n/runtime for translatable messages."
        }
      ]
    }
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // Turn off the base rule and use the TypeScript version
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        // Vitest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        beforeAll: "readonly",
        afterEach: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        // Node.js test globals
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        ResponseInit: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused imports in test files as they're often for type-only imports
      "no-undef": "error"
    }
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }]
    }
  }
];