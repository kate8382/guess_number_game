import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.js"], // Проверять все файлы с расширением .js
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser, // Добавляем глобальные переменные браузера
      },
    },
    rules: {
      'no-console': 'off', // Разрешить использование консоли
      "no-unused-vars": "error", // Считать неиспользуемые переменные ошибкой
      "semi": ["error", "always"], // Требовать точку с запятой
      quotes: ['error', 'single', { allowTemplateLiterals: true }], // Требовать одинарные кавычки и разрешить использование шаблонных строк
      indent: ['error', 2], // Отступы в 2 пробела
      'no-var': 'error', // Запретить использование var
      'linebreak-style': ['error', 'unix'], // Запретить использование Windows-стиля
      'keyword-spacing': ['error', { before: true, after: true }], // Пробелы вокруг ключевых слов
      'no-restricted-globals': 'off', // Разрешить использование глобальных переменных
      'no-alert': 'off', // Разрешить использование alert
      'no-undef': 'error', // Запретить использование несуществующих переменных
      'no-plusplus': 'off', // Разрешить использование ++ и --
      'no-multi-spaces': 'error', // Запретить использование нескольких пробелов
      'no-multiple-empty-lines': ['error', { max: 1 }], // Запретить использование нескольких пустых строк
      'import/no-extraneous-dependencies': 'off' // Отключить проверку на использование зависимостей из devDependencies
    },
  },
]);