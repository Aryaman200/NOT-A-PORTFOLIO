import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Vendored React Bits components. The policy in components/reactbits/README.md
    // is to keep these re-installable from upstream, so their internal patterns
    // are not ours to restyle. Correctness rules still apply — only the
    // stylistic hook rules that upstream trips are relaxed.
    files: ["components/reactbits/**/*.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // v2 of the site, kept verbatim and served at /v2. `support.js` is a
    // generated vendor runtime ("do not edit" at the top of the file) — linting
    // an archive we deliberately do not touch only produces noise.
    "public/v2/**",
  ]),
]);

export default eslintConfig;
