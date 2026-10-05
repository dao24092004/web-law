import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "next-env.d.ts",
  ]),
  // Custom rule tweaks
  {
    rules: {
      // React 19 / React Compiler rule "set-state-in-effect" rất khắt khe.
      // Cho phép setState đồng bộ trong effect khi cần đồng bộ state với prop (key pattern,
      // isOpen toggle, snapshot reset). Pattern cũ vẫn hợp lệ và an toàn với React 18+.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;