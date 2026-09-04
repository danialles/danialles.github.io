# Сайт-портфолио

Astro 7 + React + Tailwind, статика на GitHub Pages. Резюме `/cv` и `/resume.pdf`
собираются из одного `src/data/cv.yaml` (PDF — Typst).

    npm install
    npm run dev          # http://localhost:4321
    npm test             # юнит-тесты
    npm run build && npm run test:dist   # сборка и проверки dist/
    npm run pdf          # dist/resume.pdf (нужен typst)

Кейс = файл `src/content/cases/<slug>.md` + папка `src/assets/cases/<slug>/`.
Данные владельца — `site.config.mjs`.
