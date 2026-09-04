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

## Публикация

Сайт живёт на GitHub Pages. Каждый push в `main` запускает
`.github/workflows/deploy.yml`: юнит-тесты → `astro check` → `astro build` →
Typst собирает `resume.pdf` → тесты по `dist/` → выкладка. Красный шаг —
выкладки нет, прошлая версия остаётся.

Первый раз в настройках репозитория: **Settings → Pages → Source: GitHub
Actions**. Свой домен — файл `public/CNAME` с именем домена и в DNS четыре
A-записи GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153,
185.199.111.153) плюс `CNAME www → <логин>.github.io`.
