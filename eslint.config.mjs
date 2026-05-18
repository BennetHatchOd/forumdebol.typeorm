import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";
import pluginJs from "@eslint/js";
//import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
//   {languageOptions: { globals: globals.browser }},
  // pluginJs.configs.recommended,
  // ...tseslint.configs.recommended,
    {
      ignores: ['dist', 'node_modules'], // Игнорируем папки
    },
    {
      languageOptions: {
        parser: tsparser,
        parserOptions: {
          project: './tsconfig.json',
          sourceType: 'module',
        },
      },
      plugins: {
        '@typescript-eslint': tseslint,
      //  prettier: prettierPlugin,
      },
      rules: {
         "prettier/prettier": "off",
        //'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'warn',
        'no-debugger': 'error',
        "indent": ["error", 4], // Требуем 4 пробела
        //"prettier/prettier": ["error", { tabWidth: 4 }],  
        "no-multiple-empty-lines": "off", // Игнорирует пустые строки   
        "indent": "off", // Игнорирует отступы и табуляцию  
      },
    },
];