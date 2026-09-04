# Сайт-портфолио

Astro 7 + React + Tailwind, статика на GitHub Pages. Резюме `/cv` и `/Daniil_Eskov_CV.pdf` (дубль — `/resume.pdf`)
собираются из одного `src/data/cv.yaml` (PDF — Typst).

    npm install
    npm run dev          # http://localhost:4321
    npm test             # юнит-тесты
    npm run build && npm run test:dist   # сборка и проверки dist/
    npm run pdf          # dist/Daniil_Eskov_CV.pdf + копия dist/resume.pdf (нужен typst)

Кейс = файл `src/content/cases/<slug>.md` + папка `src/assets/cases/<slug>/`.
Данные владельца — `site.config.mjs`.

## Публикация

Сайт живёт на GitHub Pages. Каждый push в `main` запускает
`.github/workflows/deploy.yml`: юнит-тесты → `astro check` → `astro build` →
Typst собирает `Daniil_Eskov_CV.pdf` → тесты по `dist/` → выкладка. Красный шаг —
выкладки нет, прошлая версия остаётся.

Репозиторий обязан называться `<логин>.github.io` (user site): сайт собран без
базового пути, и в репозитории-проекте он ловил бы 404 на собственных стилях,
скриптах и картинках.

`<логин>` — отдельная организация GitHub (`danialles`), не личный аккаунт:
сайт и резюме не должны находиться через личный профиль владельца, а у
организации членство скрыто, и репозиторий на личной странице не появляется.
По той же причине на сайте нет ссылок на GitHub — это проверяет
`tests/dist/guards.test.ts`.

Первый раз в настройках репозитория: **Settings → Pages → Source: GitHub
Actions**. Свой домен — файл `public/CNAME` с именем домена и в DNS четыре
A-записи GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153,
185.199.111.153) плюс `CNAME www → <логин>.github.io`.
