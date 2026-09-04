# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Russian-language portfolio site for Daniil on GitHub Pages: a client-facing home page, one page per case, `/cv` and `/resume.pdf` from one YAML source, deployed by GitHub Actions on every push to `main`.

**Architecture:** Astro 7 renders everything to static HTML at build time; the only client-side JavaScript is one React island (the case gallery) and, optionally, the Yandex.Metrika counter. Cases are a content collection (`src/content/cases/*.md` + `src/assets/cases/<slug>/`); the CV is `src/data/cv.yaml`, read by the `/cv` page and by a Typst template. Everything the site knows about its owner (URL, name, contacts) lives in one file, `site.config.mjs`. Pure logic lives in `src/lib/*` under Vitest; the built `dist/` is checked by a second Vitest suite that acts as a set of guards (anonymity, forbidden words, SEO tags).

**Tech Stack:** Astro 7.3, React 19, Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript 5.9, Vitest 5, cheerio (dist tests), sharp (OG images and screenshot conversion), js-yaml + zod 4 (CV), Typst 0.14 (PDF), GitHub Actions + GitHub Pages.

**Spec:** `docs/specs/2026-09-04-portfolio-site-design.md` — read it first; the plan argues from it.

## Global Constraints

- Repo: `~/IdeaProjects/portfolio`, branch `main`. Node ≥ 22.12 (local: v25.8.1); package manager **npm**, lockfile `package-lock.json` committed.
- All UI text is **Russian**. Code comments and commit messages are **English**. Commit messages: conventional (`feat:`, `test:`, `chore:`, `docs:`, `content:`).
- No prices, no forms, no chat widgets, no testimonials, no counters, no dark theme, no English version (spec §3 «Чего нет», §8).
- MainExperts appears **only anonymously**: the strings `mainexperts` / `MainExperts` and the domain must never occur in `dist/` (spec §2). The CMS name `October` must never occur in `dist/` (spec §4). Both are enforced by `tests/dist/guards.test.ts`.
- CV: experience bullets in **past tense**; headline exactly `Fullstack-разработчик · Rust / React / Go / PHP`; PDF download name exactly `Daniil_Eskov_CV.pdf` (spec §5).
- Fonts: site — Inter Variable (`@fontsource-variable/inter`); PDF — Typst's bundled `Libertinus Serif` (verified locally: `typst fonts | grep Libertinus`). No font files are vendored.
- Every `.astro` file must be valid strict HTML: Astro 7's compiler rejects unclosed non-void tags and does not auto-fix nesting.
- Never run `git add -A` / `git add .`; stage named files. Never push unless Daniil asks.
- Screenshots of `illoca.unseen.co` must be taken in a real browser (headless Chrome renders neither the WebGL scene nor dismisses the cookie banner — verified 2026-09-04).

## File Structure

| Path | Responsibility |
|---|---|
| `site.config.mjs` | Owner facts: site URL, name, contacts, city/timezone, Metrika id. Imported by `astro.config.mjs` and components. |
| `astro.config.mjs` | Astro config: `site`, React + sitemap integrations, Tailwind Vite plugin. |
| `src/styles/global.css` | Tailwind import, theme tokens (font, accent colour), markdown body styles, print rules. |
| `src/layouts/Base.astro` | `<head>` (title, description, canonical, OG, JSON-LD, Metrika), header, footer. |
| `src/components/Header.astro`, `Footer.astro`, `ContactButtons.astro`, `Metrika.astro` | Shared chrome. |
| `src/components/home/*.astro` | One file per home section: `Hero`, `Services`, `CaseGrid`, `CaseCard`, `Process`, `Maintenance`, `Tech`, `Contacts`. |
| `src/components/cases/Gallery.tsx` | React island: thumbnails + lightbox with keyboard navigation. |
| `src/content.config.ts` | `cases` collection schema. |
| `src/content/cases/*.md` | One case each; body has H2 «Задача», «Что сделал», «Результат». |
| `src/assets/cases/<slug>/` | Screenshots (WebP), optimised by Astro. |
| `src/data/cv.yaml`, `src/data/bots.ts` | CV source; «Ещё боты» list. |
| `src/lib/contacts.ts`, `cases.ts`, `seo.ts`, `og.ts`, `cv.ts` | Pure functions; unit-tested. |
| `src/pages/index.astro`, `cv.astro`, `cases/[id].astro`, `404.astro`, `robots.txt.ts`, `og/[slug].png.ts` | Routes. |
| `cv/resume.typ` | Typst template reading `src/data/cv.yaml`. |
| `scripts/shoot.sh`, `to-webp.mjs`, `redact.mjs` | Screenshot pipeline. |
| `tests/unit/*.test.ts(x)` | Vitest for `src/lib/*` and `Gallery.tsx`. |
| `tests/dist/*.test.ts` | Vitest over built `dist/` (run after `npm run build`). |
| `.github/workflows/deploy.yml` | Build, test, PDF, publish to Pages. |

---

### Task 1: Project scaffold, Tailwind, base layout, first dist test

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `site.config.mjs`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`, `public/favicon.svg`, `tests/dist/helpers.ts`, `tests/dist/pages.test.ts`

**Interfaces:**
- Produces: `site.config.mjs` default export `{ site, name, firstName, telegram, max, email, github, city, timezone, metrikaId }` (all strings; empty string = «not configured»). `Base.astro` props `{ title: string; description: string; ogImage?: string; jsonLd?: object }`. Test helpers `html(relPath)` → cheerio root, `exists(relPath)` → boolean, `DIST` absolute path.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "portfolio",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run tests/unit",
    "test:dist": "vitest run tests/dist",
    "pdf": "typst compile --root . cv/resume.typ dist/resume.pdf"
  },
  "dependencies": {
    "@astrojs/react": "^6.0.5",
    "@astrojs/sitemap": "^3.7.4",
    "@fontsource-variable/inter": "^5.3.0",
    "@tailwindcss/vite": "^4.3.3",
    "astro": "^7.3.1",
    "js-yaml": "^4.1.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "sharp": "^0.35.4",
    "tailwindcss": "^4.3.3",
    "zod": "^4.5.4"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@testing-library/react": "^16.3.3",
    "@types/js-yaml": "^4.0.9",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "cheerio": "^1.2.0",
    "jsdom": "^30.0.1",
    "typescript": "~5.9.3",
    "vitest": "^5.0.0"
  }
}
```

- [ ] **Step 2: Write configs**

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './site.config.mjs';

export default defineConfig({
  site: site.site,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "strictNullChecks": true,
    "allowJs": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
});
```

`.gitignore`:
```
node_modules/
dist/
.astro/
raw/
.DS_Store
```

`site.config.mjs` (unknown values stay empty strings; `site` keeps the `USERNAME` marker on purpose — `tests/dist/guards.test.ts` fails until it is replaced):
```js
// Everything the site knows about its owner. Components read this, never hardcode.
// Empty string means "not configured yet": buttons/lines for it are not rendered.
export default {
  site: 'https://USERNAME.github.io',
  name: 'Даниил Есков',
  firstName: 'Даниил',
  telegram: 'https://t.me/timbelan',
  max: '',
  email: '',
  github: 'https://github.com/USERNAME',
  city: '',
  timezone: '',
  metrikaId: '',
};
```

- [ ] **Step 3: Write `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/inter";

@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  /* One accent colour for the whole site (spec §6 «Визуал»). */
  --color-accent: oklch(52% 0.2 262);
  --color-accent-ink: oklch(40% 0.17 262);
}

html { scroll-behavior: smooth; }

/* Markdown body of a case page (rendered by <Content />). */
.case-body h2 { margin-top: 2.5rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
.case-body p, .case-body ul { margin-top: 1rem; line-height: 1.7; color: var(--color-neutral-700); }
.case-body ul { padding-left: 1.25rem; list-style: disc; }
.case-body li + li { margin-top: 0.4rem; }

@media print {
  @page { margin: 1.5cm; }
  a { text-decoration: none; color: inherit; }
}
```

- [ ] **Step 4: Write `src/layouts/Base.astro`** (header/footer are added in Task 2 — for now the slot only)

```astro
---
import '../styles/global.css';
import site from '../../site.config.mjs';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  jsonLd?: object;
}
const { title, description, ogImage = '/og/home.png', jsonLd } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogUrl = new URL(ogImage, Astro.site);
---
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={site.firstName} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogUrl} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ru_RU" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
  </head>
  <body class="bg-white font-sans text-neutral-900 antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 5: Write a placeholder home page and favicon**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Даниил — сайты, сервисы и Telegram-боты" description="Разработчик под ключ.">
  <main class="mx-auto max-w-5xl px-4 py-16">
    <h1 class="text-4xl font-bold">Сайты, сервисы и Telegram-боты, которые приносят клиентов</h1>
  </main>
</Base>
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2b4fd6"/><text x="32" y="44" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">Д</text></svg>
```

- [ ] **Step 6: Install and build**

Run: `cd ~/IdeaProjects/portfolio && npm install && npm run build`
Expected: `dist/index.html` exists, build log ends with `Complete!`. If `npm install` fails on peer ranges, run `npm install` again with the version npm suggests and record the change in `package.json`.

- [ ] **Step 7: Write the dist test helpers and the first dist test**

`tests/dist/helpers.ts`:
```ts
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';
import yaml from 'js-yaml';

export const DIST = resolve(import.meta.dirname, '../../dist');
const CASES_DIR = resolve(import.meta.dirname, '../../src/content/cases');

export function exists(relPath: string): boolean {
  return existsSync(resolve(DIST, relPath));
}

export function read(relPath: string): string {
  return readFileSync(resolve(DIST, relPath), 'utf8');
}

export function html(relPath: string): CheerioAPI {
  return load(read(relPath));
}

/** Every .html file under dist/, as paths relative to dist/. */
export function allHtmlFiles(dir = DIST, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return allHtmlFiles(resolve(dir, entry.name), rel);
    return entry.name.endsWith('.html') ? [rel] : [];
  });
}

export interface CaseFrontmatter {
  slug: string;
  title: string;
  draft: boolean;
  nda: boolean;
  url?: string;
}

/** Frontmatter of every case file, so dist tests know which pages must exist. */
export function caseFrontmatters(): CaseFrontmatter[] {
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(resolve(CASES_DIR, f), 'utf8');
      const block = text.split(/^---\s*$/m)[1] ?? '';
      const data = yaml.load(block) as Record<string, unknown>;
      return {
        slug: f.replace(/\.md$/, ''),
        title: String(data.title),
        draft: Boolean(data.draft),
        nda: Boolean(data.nda),
        url: typeof data.url === 'string' ? data.url : undefined,
      };
    });
}
```

`tests/dist/pages.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { exists, html } from './helpers';

describe('home page', () => {
  it('is built with Russian lang and the offer headline', () => {
    expect(exists('index.html')).toBe(true);
    const $ = html('index.html');
    expect($('html').attr('lang')).toBe('ru');
    expect($('h1').first().text()).toContain('Сайты, сервисы и Telegram-боты');
  });
});
```

- [ ] **Step 8: Run the dist test**

Run: `npm run test:dist`
Expected: PASS (1 test). If `import.meta.dirname` is undefined, the Node version is below 20.11 — fix Node, not the code.

- [ ] **Step 9: README and commit**

`README.md`:
```markdown
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
```

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore site.config.mjs src/styles/global.css src/layouts/Base.astro src/pages/index.astro public/favicon.svg tests/dist/helpers.ts tests/dist/pages.test.ts README.md
git commit -m "chore: scaffold Astro 7 site with Tailwind, React and dist tests"
```

---

### Task 2: Contact links, header, footer

**Files:**
- Create: `src/lib/contacts.ts`, `tests/unit/contacts.test.ts`, `src/components/ContactButtons.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Modify: `src/layouts/Base.astro` (render header/footer around the slot)
- Modify: `tests/dist/pages.test.ts`

**Interfaces:**
- Produces: `contactLinks(config: { telegram: string; max: string; email: string }): ContactLink[]` where `ContactLink = { kind: 'telegram' | 'max' | 'email'; label: string; href: string }`. `<ContactButtons />` (no props; optional `class`). Header/footer rendered by `Base` on every page, both `print:hidden`.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/contacts.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contactLinks } from '../../src/lib/contacts';

describe('contactLinks', () => {
  it('returns Telegram, MAX and mailto in that order when all are set', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: 'https://max.ru/x', email: 'a@b.ru' });
    expect(links.map((l) => l.kind)).toEqual(['telegram', 'max', 'email']);
    expect(links[2].href).toBe('mailto:a@b.ru');
    expect(links.map((l) => l.label)).toEqual(['Telegram', 'MAX', 'Почта']);
  });

  it('skips channels that are not configured', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: '', email: '' });
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('telegram');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/lib/contacts`.

- [ ] **Step 3: Implement `src/lib/contacts.ts`**

```ts
export interface ContactConfig {
  telegram: string;
  max: string;
  email: string;
}

export interface ContactLink {
  kind: 'telegram' | 'max' | 'email';
  label: string;
  href: string;
}

/** Buttons in the order the spec fixes: Telegram, MAX, email. Empty config = no button. */
export function contactLinks(config: ContactConfig): ContactLink[] {
  const links: ContactLink[] = [];
  if (config.telegram) links.push({ kind: 'telegram', label: 'Telegram', href: config.telegram });
  if (config.max) links.push({ kind: 'max', label: 'MAX', href: config.max });
  if (config.email) links.push({ kind: 'email', label: 'Почта', href: `mailto:${config.email}` });
  return links;
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm test`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the components**

`src/components/ContactButtons.astro`:
```astro
---
import site from '../../site.config.mjs';
import { contactLinks } from '../lib/contacts';

interface Props { class?: string }
const { class: className = '' } = Astro.props;
const links = contactLinks(site);
const primary = 'bg-accent text-white hover:bg-accent-ink';
const secondary = 'border border-neutral-300 text-neutral-900 hover:border-neutral-900';
---
<div class={`flex flex-wrap gap-3 ${className}`} data-contacts>
  {links.map((link, i) => (
    <a
      href={link.href}
      rel={link.kind === 'email' ? undefined : 'noopener'}
      target={link.kind === 'email' ? undefined : '_blank'}
      class={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition ${i === 0 ? primary : secondary}`}
      data-contact={link.kind}
    >{link.label}</a>
  ))}
</div>
```

`src/components/Header.astro`:
```astro
---
import site from '../../site.config.mjs';
---
<header class="print:hidden">
  <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-5" aria-label="Основная навигация">
    <a href="/" class="text-lg font-semibold tracking-tight">{site.firstName}</a>
    <ul class="flex gap-6 text-sm text-neutral-600">
      <li><a href="/#cases" class="hover:text-neutral-900">Кейсы</a></li>
      <li><a href="/#process" class="hover:text-neutral-900">Как работаем</a></li>
      <li><a href="/#contacts" class="hover:text-neutral-900">Написать</a></li>
    </ul>
  </nav>
</header>
```

`src/components/Footer.astro`:
```astro
---
import site from '../../site.config.mjs';
const year = new Date().getFullYear();
---
<footer class="mt-24 border-t border-neutral-200 print:hidden">
  <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500">
    <p>© {year} {site.firstName}</p>
    <ul class="flex gap-6">
      <li><a href="/cv/" class="hover:text-neutral-900">Резюме</a></li>
      <li><a href={site.github} rel="noopener" target="_blank" class="hover:text-neutral-900">GitHub</a></li>
    </ul>
  </div>
</footer>
```

- [ ] **Step 6: Mount them in `Base.astro`**

In `src/layouts/Base.astro` add imports after the `site` import:
```astro
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
```
and replace the body:
```astro
  <body class="bg-white font-sans text-neutral-900 antialiased">
    <Header />
    <slot />
    <Footer />
  </body>
```

- [ ] **Step 7: Extend the dist test**

Append to `tests/dist/pages.test.ts` inside `describe('home page')`:
```ts
  it('links to the CV from the footer and shows the Telegram button', () => {
    const $ = html('index.html');
    expect($('footer a[href="/cv/"]').text()).toBe('Резюме');
    expect($('[data-contact="telegram"]').attr('href')).toMatch(/^https:\/\/t\.me\//);
  });
```
Put a `<ContactButtons />` in the placeholder `index.astro` `<main>` under the `<h1>` (import it: `import ContactButtons from '../components/ContactButtons.astro';`).

- [ ] **Step 8: Build and run dist tests**

Run: `npm run build && npm run test:dist`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/lib/contacts.ts tests/unit/contacts.test.ts src/components/ContactButtons.astro src/components/Header.astro src/components/Footer.astro src/layouts/Base.astro src/pages/index.astro tests/dist/pages.test.ts
git commit -m "feat: contact buttons, header and footer driven by site.config"
```

---

### Task 3: Screenshot pipeline and covers for the public sites

**Files:**
- Create: `scripts/shoot.sh`, `scripts/to-webp.mjs`, `scripts/redact.mjs`, `src/assets/cases/{illoca,oshten-tur,arb365,economenergo,skbereg}/cover.webp` (+ `01.webp`, `02.webp`, `mobile.webp` where obtained)

**Interfaces:**
- Produces: WebP files consumed by the `cover` / `gallery` frontmatter fields in Task 4. Naming: `cover.webp` (desktop hero, ≤1600 px wide), `01.webp`… (further desktop shots), `mobile.webp` (390 px viewport).

- [ ] **Step 1: Write `scripts/shoot.sh`**

```bash
#!/usr/bin/env bash
# Headless screenshot with the installed Chrome. Usage:
#   scripts/shoot.sh <url> <out.png> [desktop|mobile]
# Good enough for plain sites; WebGL pages (illoca) come out empty — shoot those by hand.
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
size="1440,900"
[[ "${3:-desktop}" == "mobile" ]] && size="390,844"
"$CHROME" --headless=new --hide-scrollbars --window-size="$size" \
  --virtual-time-budget=8000 --screenshot="$2" "$1" 2>/dev/null
echo "wrote $2"
```
Then `chmod +x scripts/shoot.sh`.

- [ ] **Step 2: Write `scripts/to-webp.mjs`**

```js
// Usage: node scripts/to-webp.mjs <in.png> <out.webp> [maxWidth=1600]
import sharp from 'sharp';

const [, , input, output, maxWidth = '1600'] = process.argv;
if (!input || !output) {
  console.error('usage: to-webp.mjs <in.png> <out.webp> [maxWidth]');
  process.exit(1);
}
await sharp(input)
  .resize({ width: Number(maxWidth), withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(output);
console.log(`wrote ${output}`);
```

- [ ] **Step 3: Write `scripts/redact.mjs`** (blurs brand areas before an anonymous screenshot is committed)

```js
// Usage: node scripts/redact.mjs <in.png> <out.png> x,y,w,h [x,y,w,h ...]
// Each rectangle is replaced by a heavily blurred copy of itself.
import sharp from 'sharp';

const [, , input, output, ...rects] = process.argv;
if (!input || !output || rects.length === 0) {
  console.error('usage: redact.mjs <in> <out> x,y,w,h [...]');
  process.exit(1);
}
const overlays = await Promise.all(
  rects.map(async (rect) => {
    const [left, top, width, height] = rect.split(',').map(Number);
    const blurred = await sharp(input).extract({ left, top, width, height }).blur(25).toBuffer();
    return { input: blurred, left, top };
  }),
);
await sharp(input).composite(overlays).toFile(output);
console.log(`wrote ${output}`);
```

- [ ] **Step 4: Shoot the plain sites**

```bash
mkdir -p raw src/assets/cases/{illoca,oshten-tur,arb365,economenergo,skbereg}
for s in "oshten-tur https://oshten-tur.ru/" "arb365 https://arb365.net/en" "economenergo https://economenergo.com/" "skbereg https://skbereg.ru/"; do
  set -- $s
  scripts/shoot.sh "$2" "raw/$1.png"
  scripts/shoot.sh "$2" "raw/$1-mobile.png" mobile
  node scripts/to-webp.mjs "raw/$1.png" "src/assets/cases/$1/cover.webp"
  node scripts/to-webp.mjs "raw/$1-mobile.png" "src/assets/cases/$1/mobile.webp" 800
done
```
Open each `raw/*.png` (Read tool) and check it shows the real page, not a cookie banner or a blank hero. For any bad one, shoot manually as in Step 5.

- [ ] **Step 5: Shoot illoca by hand**

In a real Chrome window at 1440×900: open https://illoca.unseen.co/, dismiss the cookie banner, wait for the scene, `⌘⇧4` → save to `raw/illoca.png`; scroll to a second scene → `raw/illoca-01.png`; narrow the window to ~390 px → `raw/illoca-mobile.png`. Then:
```bash
node scripts/to-webp.mjs raw/illoca.png src/assets/cases/illoca/cover.webp
node scripts/to-webp.mjs raw/illoca-01.png src/assets/cases/illoca/01.webp
node scripts/to-webp.mjs raw/illoca-mobile.png src/assets/cases/illoca/mobile.webp 800
```
If the session cannot drive a browser, ask Daniil for these three screenshots — this is the only case where the tooling cannot substitute a person.

- [ ] **Step 6: Commit**

```bash
git add scripts/shoot.sh scripts/to-webp.mjs scripts/redact.mjs src/assets/cases
git commit -m "chore: screenshot pipeline and covers for public case sites"
```

---

### Task 4: Cases collection, case page, gallery island, first case (illoca)

**Files:**
- Create: `src/content.config.ts`, `src/lib/cases.ts`, `tests/unit/cases.test.ts`, `src/components/cases/Gallery.tsx`, `tests/unit/gallery.test.tsx`, `src/pages/cases/[id].astro`, `src/content/cases/illoca.md`, `tests/dist/cases.test.ts`

**Interfaces:**
- Produces: collection `cases` with frontmatter `{ title, niche, role: 'front'|'fullstack'|'turnkey', year?, url?, nda=false, cover, coverAlt, gallery: {src, alt}[] = [], result, stack: string[] = [], order, draft=false }`. `roleLabel(role): string`; `sortCases(entries): entries` (drops drafts, sorts by `order`). `Gallery` React component with prop `shots: Shot[]`, `Shot = { thumb: string; full: string; width: number; height: number; alt: string }`. Route `/cases/<id>/`.

- [ ] **Step 1: Write the failing unit test for `lib/cases.ts`**

`tests/unit/cases.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { roleLabel, sortCases } from '../../src/lib/cases';

describe('roleLabel', () => {
  it('maps the three roles to the labels from the spec', () => {
    expect(roleLabel('front')).toBe('фронт');
    expect(roleLabel('fullstack')).toBe('фронт + бэк');
    expect(roleLabel('turnkey')).toBe('под ключ');
  });
});

describe('sortCases', () => {
  it('drops drafts and orders by `order` ascending', () => {
    const entries = [
      { id: 'b', data: { order: 20, draft: false } },
      { id: 'd', data: { order: 5, draft: true } },
      { id: 'a', data: { order: 10, draft: false } },
    ];
    expect(sortCases(entries).map((e) => e.id)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/lib/cases`.

- [ ] **Step 3: Implement `src/lib/cases.ts`**

```ts
export type Role = 'front' | 'fullstack' | 'turnkey';

const ROLE_LABELS: Record<Role, string> = {
  front: 'фронт',
  fullstack: 'фронт + бэк',
  turnkey: 'под ключ',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

/** Grid order: drafts never show, the rest by `order` ascending. */
export function sortCases<T extends { data: { order: number; draft: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => !e.data.draft).sort((a, b) => a.data.order - b.data.order);
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write the failing gallery test**

`tests/unit/gallery.test.tsx`:
```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Gallery, { type Shot } from '../../src/components/cases/Gallery';

const shots: Shot[] = [
  { thumb: '/t1.webp', full: '/f1.webp', width: 1600, height: 1000, alt: 'Первый' },
  { thumb: '/t2.webp', full: '/f2.webp', width: 1600, height: 1000, alt: 'Второй' },
];

afterEach(cleanup);

describe('Gallery', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<Gallery shots={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('opens the lightbox on click, steps with arrows, closes on Escape', () => {
    render(<Gallery shots={shots} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Открыть: Первый' }));
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f1.webp');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f2.webp');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f1.webp');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
```

- [ ] **Step 6: Run it to see it fail**

Run: `npm test`
Expected: FAIL — cannot resolve `Gallery`.

- [ ] **Step 7: Implement `src/components/cases/Gallery.tsx`**

```tsx
import { useEffect, useState } from 'react';

export interface Shot {
  thumb: string;
  full: string;
  width: number;
  height: number;
  alt: string;
}

// The only client-side island on the site: thumbnails + a lightbox with keyboard navigation.
export default function Gallery({ shots }: { shots: Shot[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = shots.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? null : (i + 1) % count));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? null : (i - 1 + count) % count));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, count]);

  if (count === 0) return null;

  const navButton = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-2 text-3xl text-white hover:bg-white/20';

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shots.map((shot, i) => (
          <li key={shot.full}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Открыть: ${shot.alt}`}
              className="block w-full overflow-hidden rounded-lg border border-neutral-200 transition hover:border-neutral-400"
            >
              <img src={shot.thumb} alt={shot.alt} loading="lazy" width={shot.width} height={shot.height} className="h-auto w-full" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={shots[open].alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
          onClick={() => setOpen(null)}
        >
          <img
            src={shots[open].full}
            alt={shots[open].alt}
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" aria-label="Закрыть" onClick={() => setOpen(null)} className="absolute right-4 top-4 text-3xl text-white">×</button>
          {count > 1 && (
            <>
              <button type="button" aria-label="Предыдущий" className={`${navButton} left-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + count) % count); }}>‹</button>
              <button type="button" aria-label="Следующий" className={`${navButton} right-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % count); }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Run the unit tests**

Run: `npm test`
Expected: PASS (gallery: 2 tests). If jsdom complains about `window.matchMedia`, nothing in the component uses it — the failure is elsewhere; read the message.

- [ ] **Step 9: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cases = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      niche: z.string().min(1),
      role: z.enum(['front', 'fullstack', 'turnkey']),
      year: z.number().int().optional(),
      url: z.url().optional(),
      nda: z.boolean().default(false),
      cover: image(),
      coverAlt: z.string().min(1),
      gallery: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
      result: z.string().min(1),
      stack: z.array(z.string()).default([]),
      order: z.number().int(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { cases };
```

- [ ] **Step 10: Write the first case `src/content/cases/illoca.md`**

```markdown
---
title: illoca
niche: Сайт-презентация с WebGL-сценами
role: front
url: https://illoca.unseen.co/
cover: ../../assets/cases/illoca/cover.webp
coverAlt: Главный экран illoca — интерактивная сцена на всю страницу
gallery:
  - src: ../../assets/cases/illoca/01.webp
    alt: Вторая сцена с анимацией при прокрутке
  - src: ../../assets/cases/illoca/mobile.webp
    alt: Мобильная версия
result: Интерактивный сайт с 3D-сценами, который держит 60 кадров в секунду на телефоне
stack: [Nuxt 3, three.js, GLSL-шейдеры, GSAP, Lenis, Matter.js]
order: 10
---

## Задача

Студии нужен был сайт-презентация, который сам по себе демонстрирует уровень: не
каталог и не лендинг, а интерактивная сцена, реагирующая на прокрутку и курсор.
Дизайн и анимации были заданы макетами — требовалось воплотить их без потери
плавности на телефонах.

## Что сделал

- Собрал фронтенд на Nuxt 3 с плавной прокруткой (Lenis) и сценарной анимацией (GSAP).
- Реализовал 3D-сцены на three.js с собственными GLSL-шейдерами и физикой объектов на Matter.js.
- Оптимизировал сцены под мобильные устройства: упрощённые материалы и отложенная загрузка тяжёлых ресурсов.
- Настроил сборку и деплой на Netlify.

## Результат

Сайт запущен, работает на десктопе и телефонах без подвисаний. Заказчик получил
презентацию, которую показывает клиентам как пример собственного уровня.
```
(If `01.webp` or `mobile.webp` is missing after Task 3, drop that gallery entry — the build fails on a missing image, by design.)

- [ ] **Step 11: Write the case page `src/pages/cases/[id].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import { Image, getImage } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import ContactButtons from '../../components/ContactButtons.astro';
import Gallery from '../../components/cases/Gallery';
import { roleLabel } from '../../lib/cases';

export async function getStaticPaths() {
  const cases = await getCollection('cases', ({ data }) => !data.draft);
  return cases.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { data } = entry;
const { Content } = await render(entry);

// getImage() is server-only; the React island receives plain URLs.
const shots = await Promise.all(
  data.gallery.map(async ({ src, alt }) => {
    const full = await getImage({ src, format: 'webp', width: 1600 });
    const thumb = await getImage({ src, format: 'webp', width: 640 });
    return {
      full: full.src,
      thumb: thumb.src,
      width: Number(full.attributes.width),
      height: Number(full.attributes.height),
      alt,
    };
  }),
);
---
<Base title={`${data.title} — кейс`} description={data.result} ogImage={`/og/${entry.id}.png`}>
  <main class="mx-auto max-w-3xl px-4 py-12">
    <p class="text-sm text-neutral-500">
      {data.niche}{data.year && ` · ${data.year}`} · {roleLabel(data.role)}
    </p>
    <h1 class="mt-2 text-4xl font-bold tracking-tight">{data.title}</h1>
    {data.url
      ? <a href={data.url} rel="noopener" target="_blank" class="mt-3 inline-block text-accent hover:underline">Открыть сайт ↗</a>
      : <p class="mt-3 text-neutral-500">Закрытая система, под NDA</p>}

    <Image src={data.cover} alt={data.coverAlt} widths={[720, 1440]} sizes="(max-width: 768px) 100vw, 768px" class="mt-8 rounded-xl border border-neutral-200" />

    <div class="case-body"><Content /></div>

    {shots.length > 0 && (
      <section class="mt-12">
        <h2 class="text-2xl font-semibold">Экраны</h2>
        <div class="mt-4"><Gallery client:visible shots={shots} /></div>
      </section>
    )}

    <section class="mt-16 rounded-2xl bg-neutral-50 p-8">
      <h2 class="text-2xl font-semibold">Похожая задача? Напишите</h2>
      <p class="mt-2 text-neutral-600">Опишу, как сделал бы у вас, и посчитаю стоимость за день.</p>
      <ContactButtons class="mt-5" />
    </section>
  </main>
</Base>
```

- [ ] **Step 12: Write `tests/dist/cases.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { caseFrontmatters, exists, html } from './helpers';

const published = caseFrontmatters().filter((c) => !c.draft);
const drafts = caseFrontmatters().filter((c) => c.draft);

describe('case pages', () => {
  it.each(published)('$slug is built with the three sections', ({ slug, title, url, nda }) => {
    const path = `cases/${slug}/index.html`;
    expect(exists(path), path).toBe(true);
    const $ = html(path);
    expect($('h1').first().text()).toBe(title);
    const h2 = $('.case-body h2').map((_, el) => $(el).text().trim()).get();
    expect(h2).toEqual(['Задача', 'Что сделал', 'Результат']);
    if (url) expect($(`a[href="${url}"]`).length).toBeGreaterThan(0);
    if (nda) expect($('main').text()).toContain('под NDA');
  });

  it.each(drafts)('$slug is a draft and is not built', ({ slug }) => {
    expect(exists(`cases/${slug}/index.html`)).toBe(false);
  });
});
```
(`it.each([])` on an empty `drafts` array is fine in Vitest 5 — it simply registers no tests.)

- [ ] **Step 13: Build and run dist tests**

Run: `npm run build && npm run test:dist`
Expected: PASS; `dist/cases/illoca/index.html` exists. Common failures: image path wrong in frontmatter (Astro prints the path), `z.url` missing (then zod is < 4 — check `npm ls zod`).

- [ ] **Step 14: Commit**

```bash
git add src/content.config.ts src/lib/cases.ts tests/unit/cases.test.ts src/components/cases/Gallery.tsx tests/unit/gallery.test.tsx src/pages/cases/[id].astro src/content/cases/illoca.md tests/dist/cases.test.ts
git commit -m "feat: cases collection, case page with gallery island, illoca case"
```

---

### Task 5: The remaining case files

**Files:**
- Create: `src/content/cases/oshten-tur.md`, `edu-platform.md`, `arb365.md`, `sports-analytics.md`, `economenergo.md`, `bot-transcribe.md`, `bot-parser.md`, `skbereg.md`; `src/assets/cases/edu-platform/cover.webp`
- Create: `tests/dist/guards.test.ts`

**Interfaces:**
- Consumes: schema from Task 4. Slugs are final — Task 8 (OG) and the home grid use `entry.id`.
- Produces: the grid order 10…90; `sports-analytics`, `bot-transcribe`, `bot-parser`, `skbereg` are `draft: true` until Task 13 supplies screenshots and facts.

Texts below are first drafts from what is known today; Task 13 replaces facts after the interview. The anonymous case never names the product; the guard test enforces it.

- [ ] **Step 1: Write the anonymity/forbidden-words guard first**

`tests/dist/guards.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { allHtmlFiles, read } from './helpers';

// Words that must never reach the published HTML (spec §2, §4, §6).
const FORBIDDEN: Array<[string, RegExp]> = [
  ['brand of the anonymous case', /mainexperts/i],
  ['CMS name hidden by positioning', /october\s*cms|\boctober\b/i],
  ['raw PHP leaked from a client site', /<\?php/],
  ['unfilled site.config value', /USERNAME/],
];

describe('published HTML', () => {
  const files = allHtmlFiles();

  it('has pages to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN)('never contains %s', (_label, pattern) => {
    const offenders = files.filter((f) => pattern.test(read(f)));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it against the current build**

Run: `npm run build && npm run test:dist`
Expected: `never contains unfilled site.config value` FAILS (the `USERNAME` marker is still in `site.config.mjs`). That is the intended state until Task 13; the other three guards PASS. Keep the failing guard — it is the reminder.

- [ ] **Step 3: Take and redact the anonymous cover**

The education platform runs locally (`http://localhost:5173`, Vite dev of the Vue frontend) or on its public domain. Shoot a screen where the brand is small (the profile hub or a report page), then blur the logo rectangle — measure it in the PNG first (Read the image, note pixel coordinates):
```bash
mkdir -p src/assets/cases/edu-platform
scripts/shoot.sh "http://localhost:5173/" raw/edu.png
node scripts/redact.mjs raw/edu.png raw/edu-redacted.png 24,16,180,48
node scripts/to-webp.mjs raw/edu-redacted.png src/assets/cases/edu-platform/cover.webp
```
Open `raw/edu-redacted.png` and confirm no brand text is legible anywhere (header, footer, browser title is not in the shot). Repeat for one or two more screens as `01.webp`, `02.webp`.

- [ ] **Step 4: Write the case files**

`src/content/cases/oshten-tur.md`:
```markdown
---
title: Оштен-Тур
niche: Сайт турфирмы: туры по Адыгее и Кавказу
role: fullstack
url: https://oshten-tur.ru/
cover: ../../assets/cases/oshten-tur/cover.webp
coverAlt: Главная страница Оштен-Тур с подборкой туров
gallery:
  - src: ../../assets/cases/oshten-tur/mobile.webp
    alt: Мобильная версия каталога туров
result: Каталог туров с заявками, которым турфирма управляет сама
order: 20
---

## Задача

Турфирме нужен был сайт, где клиент находит тур по датам и направлению и оставляет
заявку, а менеджер добавляет и правит туры без программиста. Главное требование —
визуал: фотографии гор должны продавать.

## Что сделал

- Спроектировал структуру: направления, туры, даты заездов, страницы «как добраться» и «что взять».
- Собрал фронтенд с крупными фото и карточками туров, адаптированный под телефон.
- Сделал административную часть: менеджер заводит тур, даты и цены, публикует и снимает с публикации.
- Подключил формы заявок с отправкой на почту менеджера.

## Результат

Сайт работает и наполняется силами турфирмы. Один из первых моих проектов: визуал
получился сильнее, чем скорость загрузки — на новых проектах оптимизация идёт с
первого дня.
```

`src/content/cases/edu-platform.md`:
```markdown
---
title: Платформа онлайн-образования и профориентации
niche: Кабинеты, оплаты, отчёты, бот и Mini App
role: turnkey
cover: ../../assets/cases/edu-platform/cover.webp
coverAlt: Личный кабинет пользователя платформы (название скрыто)
result: Платформа, где клиент проходит диагностику, покупает программы и получает PDF-отчёты, а команда управляет всем через свою админку
order: 30
---

## Задача

Образовательному проекту нужна была единая система вместо набора сервисов: приём
оплат, личные кабинеты клиентов и экспертов, прохождение тестов с автоматическими
отчётами, расписание занятий, уведомления менеджерам. По условиям договора название
проекта не раскрывается — показаны экраны с закрытым брендом.

## Что сделал

- Спроектировал и написал бэкенд платформы: пользователи, пакеты услуг, оплаты и подписки, кошелёк, расписание.
- Собрал личные кабинеты клиента и эксперта и административную панель с ролями и отчётами.
- Реализовал генерацию PDF-отчётов по результатам диагностик, включая многошаговую генерацию текста ИИ.
- Сделал Telegram-бота для команды: лента новых регистраций и заявок с персональными фильтрами для каждого менеджера, статистика по источникам.
- Сделал Telegram Mini App для входа и прохождения диагностики прямо из мессенджера.
- Настроил серверы, деплой одной командой, резервные копии и мониторинг.

## Результат

Платформа принимает оплаты и обслуживает клиентов, команда работает в собственной
админке, а разработка продолжается по плану владельца.
```

`src/content/cases/arb365.md`:
```markdown
---
title: ARB365
niche: Сервис с подпиской, ботом и дашбордом
role: turnkey
url: https://arb365.net/en
cover: ../../assets/cases/arb365/cover.webp
coverAlt: Главная страница ARB365
gallery:
  - src: ../../assets/cases/arb365/mobile.webp
    alt: Мобильная версия
result: Сайт, личный кабинет с оплатой криптовалютой и Telegram-бот в одной системе
order: 40
---

## Задача

Заказчику нужен был сервис с платным доступом: сайт с регистрацией через
соцсети, приём оплаты криптовалютой, личный кабинет с дашбордом и Telegram-бот,
дублирующий ключевые функции для тех, кто живёт в мессенджере.

## Что сделал

- Собрал сайт и личный кабинет с дашбордом пользователя.
- Подключил вход через социальные сети и приём платежей через CryptoCloud с автоматическим открытием доступа.
- Сделал Telegram-бота с уведомлениями и доступом к данным кабинета.
- Настроил серверную часть и деплой.

## Результат

Сервис запущен и принимает оплаты. Показываю как пример связки «сайт + оплата +
бот» — по визуалу это не лучшая моя работа, по механике всё работает как задумано.
```

`src/content/cases/sports-analytics.md`:
```markdown
---
title: Аналитическая платформа по футболу и киберспорту
niche: Сбор статистики матчей и прогнозы
role: turnkey
nda: true
cover: ../../assets/cases/sports-analytics/cover.webp
coverAlt: Экран статистики матча (название скрыто)
result: Платформа, которая собирает детальную статистику по матчам и строит на её основе прогнозы; передана заказчику целиком
order: 50
draft: true
---

## Задача

Заказчику нужна была закрытая система: автоматически собирать подробную статистику
по футбольным и киберспортивным матчам из нескольких источников и строить прогнозы
на её основе. Платформа передана заказчику полностью и работает под его названием —
по условиям NDA показаны только обезличенные экраны.

## Что сделал

- Спроектировал модель данных: турниры, команды, матчи, события внутри матча, коэффициенты.
- Написал сборщики статистики из внешних источников с расписанием и контролем ошибок.
- Реализовал расчёт прогнозов и их публикацию в интерфейсе.
- Собрал интерфейс аналитика: фильтры, таблицы, карточки матчей.

## Результат

Платформа принята заказчиком и передана вместе с кодом и документацией.
```

`src/content/cases/economenergo.md`:
```markdown
---
title: ЭкономЭнерго
niche: Корпоративный сайт с каталогом оборудования
role: fullstack
url: https://economenergo.com/
cover: ../../assets/cases/economenergo/cover.webp
coverAlt: Главная страница ЭкономЭнерго
gallery:
  - src: ../../assets/cases/economenergo/mobile.webp
    alt: Мобильная версия
result: Многостраничный сайт с каталогом, формами заявок, обратным звонком и подпиской
order: 60
---

## Задача

Компании требовался корпоративный сайт с большим числом разделов: продукция,
решения, документы, новости. Нужны были формы заявок с защитой от спама, заказ
обратного звонка и подписка на рассылку.

## Что сделал

- Спроектировал структуру десятков разделов и страниц с единой навигацией.
- Собрал фронтенд и административную часть, в которой сотрудники ведут каталог и новости.
- Подключил формы с капчей, обратный звонок и подписку с отправкой на почту.

## Результат

Сайт работает и наполняется сотрудниками компании. Из уроков проекта — скорость
загрузки при таком объёме страниц надо закладывать в архитектуру с самого начала.
```

`src/content/cases/bot-transcribe.md`:
```markdown
---
title: Бот-транскрибатор
niche: Telegram-бот: голосовые и аудио в текст
role: turnkey
cover: ../../assets/cases/bot-transcribe/cover.webp
coverAlt: Диалог с ботом: отправлено голосовое, получен текст
result: Голосовое сообщение превращается в текст за секунды, без установки приложений
order: 70
draft: true
---

## Задача

Людям, которые получают много голосовых сообщений, нужен способ читать их, а не
слушать. Решение должно жить внутри Telegram и не требовать ничего, кроме
пересылки сообщения.

## Что сделал

- Сделал бота, который принимает голосовые и аудиофайлы, распознаёт речь и возвращает текст.
- Добавил обработку длинных записей по частям и очередь, чтобы бот не падал под нагрузкой.
- Настроил лимиты и учёт использования на пользователя.

## Результат

Бот работает, распознаёт русскую речь и отдаёт текст в том же чате.
```

`src/content/cases/bot-parser.md`:
```markdown
---
title: Парсер-бот
niche: Telegram-бот: слежение за новыми объявлениями
role: turnkey
cover: ../../assets/cases/bot-parser/cover.webp
coverAlt: Сообщение бота с новым объявлением по фильтру
result: Новые объявления по заданным фильтрам приходят в чат раньше, чем их увидят конкуренты
order: 80
draft: true
---

## Задача

Заказчику нужно было узнавать о новых объявлениях на площадках по своим фильтрам
сразу после публикации — вручную обновлять страницы невозможно.

## Что сделал

- Написал сборщик объявлений с обходом защиты от автоматических запросов и повторными попытками.
- Сделал бота, где пользователь задаёт фильтры, а новые совпадения приходят сообщением с ссылкой и ключевыми полями.
- Настроил хранение уже показанных объявлений, чтобы не было повторов.

## Результат

Бот работает круглосуточно и присылает объявления в течение минуты после появления.
```

`src/content/cases/skbereg.md`:
```markdown
---
title: Скалистый Берег
niche: Сайт загородного комплекса
role: front
url: https://skbereg.ru/
cover: ../../assets/cases/skbereg/cover.webp
coverAlt: Главная страница Скалистого Берега
result: Витрина с фотографиями, ценами и бронированием
order: 90
draft: true
---

## Задача

Загородному комплексу нужна была витрина: фотографии, домики, цены, бронирование.

## Что сделал

- Собрал фронтенд по готовому дизайну, адаптированный под телефон.
- Подключил формы бронирования.

## Результат

Сайт работает. В резерве портфолио, пока на сайте не исправлена ошибка шаблона,
видимая в исходном коде страницы.
```

- [ ] **Step 5: Build and run all tests**

Run: `npm run build && npm run test:dist`
Expected: `cases.test.ts` PASS for 5 published cases (`illoca`, `oshten-tur`, `edu-platform`, `arb365`, `economenergo`) and 4 drafts not built; `guards.test.ts` — only the `USERNAME` guard fails. Drafts with a `cover` path that does not exist yet still validate? **No** — Astro resolves `image()` for drafts too. So for the four drafts create a temporary 1600×1000 cover:
```bash
for s in sports-analytics bot-transcribe bot-parser; do
  mkdir -p src/assets/cases/$s
  node -e "require('sharp')({create:{width:1600,height:1000,channels:3,background:'#e5e5e5'}}).webp().toFile('src/assets/cases/$s/cover.webp')"
done
```
(`skbereg` already has a real cover from Task 3.) Task 13 replaces them with real screenshots.

- [ ] **Step 6: Commit**

```bash
git add src/content/cases tests/dist/guards.test.ts src/assets/cases
git commit -m "content: first drafts of all case pages and dist guards"
```

---

### Task 6: Home page sections

**Files:**
- Create: `src/data/bots.ts`, `src/components/home/Hero.astro`, `Services.astro`, `CaseCard.astro`, `CaseGrid.astro`, `Process.astro`, `Maintenance.astro`, `Tech.astro`, `Contacts.astro`
- Modify: `src/pages/index.astro` (replace placeholder), `tests/dist/pages.test.ts`

**Interfaces:**
- Consumes: `sortCases`, `roleLabel` (Task 4), `ContactButtons` (Task 2), `site.config.mjs`.
- Produces: section ids `#services`, `#cases`, `#process`, `#maintenance`, `#tech`, `#contacts` (header links point at `#cases`, `#process`, `#contacts`).

- [ ] **Step 1: Extend the dist test first**

Replace the body of `describe('home page')` in `tests/dist/pages.test.ts` with:
```ts
  const $ = html('index.html');

  it('is built with Russian lang and the offer headline', () => {
    expect($('html').attr('lang')).toBe('ru');
    expect($('h1').first().text()).toContain('Сайты, сервисы и Telegram-боты');
  });

  it('links to the CV from the footer and shows the Telegram button', () => {
    expect($('footer a[href="/cv/"]').text()).toBe('Резюме');
    expect($('[data-contact="telegram"]').first().attr('href')).toMatch(/^https:\/\/t\.me\//);
  });

  it('has every section from the spec in order', () => {
    const ids = $('main section[id]').map((_, el) => $(el).attr('id')).get();
    expect(ids).toEqual(['services', 'cases', 'process', 'maintenance', 'tech', 'contacts']);
  });

  it('shows four service cards and the bots list', () => {
    expect($('#services article').length).toBe(4);
    expect($('#services [data-bots] li').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the published cases in grid order without drafts', () => {
    const hrefs = $('#cases a[href^="/cases/"]').map((_, el) => $(el).attr('href')).get();
    expect(hrefs[0]).toBe('/cases/illoca/');
    expect(hrefs).not.toContain('/cases/skbereg/');
  });

  it('never mentions prices', () => {
    expect($('main').text()).not.toMatch(/₽|руб\.|от \d+ ?000/);
  });
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run build && npm run test:dist`
Expected: the three new tests FAIL (no sections yet).

- [ ] **Step 3: Write `src/data/bots.ts`**

```ts
export interface Bot {
  name: string;
  what: string;
  who: string;
}

// «Ещё боты» — one line per bot that does not need a page of its own (spec §3.2).
export const bots: Bot[] = [
  { name: 'Транскрибатор', what: 'превращает голосовые и аудио в текст', who: 'для тех, кому пишут голосовыми' },
  { name: 'Парсер объявлений', what: 'присылает новые объявления по фильтрам', who: 'для агентств и перекупщиков' },
  { name: 'Лента заявок', what: 'сообщает о новых регистрациях, каждому менеджеру — свой фильтр', who: 'для отделов продаж' },
];
```

- [ ] **Step 4: Write the section components**

`src/components/home/Hero.astro`:
```astro
---
import site from '../../../site.config.mjs';
import ContactButtons from '../ContactButtons.astro';
---
<section class="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20">
  <h1 class="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
    Сайты, сервисы и Telegram-боты, которые приносят клиентов
  </h1>
  <p class="mt-6 max-w-2xl text-lg text-neutral-600 sm:text-xl">
    {site.firstName}, разработчик. Делаю под ключ: от дизайна до запуска и сопровождения.
    Один исполнитель на весь проект — без агентских наценок и «это не ко мне».
  </p>
  <ContactButtons class="mt-8" />
</section>
```

`src/components/home/Services.astro`:
```astro
---
import { bots } from '../../data/bots';

const services = [
  {
    title: 'Сайт для бизнеса',
    lead: 'Лендинг, корпоративный сайт, каталог.',
    items: [
      'Дизайн и вёрстка под телефон и компьютер',
      'Формы заявок с уведомлением в Telegram',
      'Аналитика: Яндекс.Метрика и цели',
      'Готов к рекламе и поиску: заголовки, разметка, скорость',
    ],
  },
  {
    title: 'Telegram-бот и Mini App',
    lead: 'Запись, заказы, уведомления, каталог — внутри мессенджера. MAX и VK тоже.',
    items: [
      'Запись и напоминания клиентам',
      'Заказы и оплата прямо в чате',
      'Уведомления менеджерам о заявках',
      'Mini App — полноценный интерфейс внутри Telegram',
    ],
    bots: true,
  },
  {
    title: 'Сервис, личный кабинет, админка',
    lead: 'CRM, учёт, платежи, интеграции с тем, что у вас уже есть.',
    items: [
      'Кабинеты клиентов и сотрудников',
      'Приём платежей и подписки',
      'Админка с ролями и отчётами',
      'Интеграции: CRM, платёжные системы, почта, 1С',
    ],
  },
  {
    title: 'Сопровождение и развитие',
    lead: 'Чтобы продукт продолжал приносить клиентов после запуска.',
    items: [
      'Обновления и поддержка',
      'Статьи и страницы под поисковые запросы',
      'Рекламные кампании в Яндексе и VK',
      'Раз в месяц — отчёт: что пришло, что менять',
    ],
  },
];
---
<section id="services" class="mx-auto max-w-5xl px-4 py-16">
  <h2 class="text-3xl font-bold tracking-tight">Что делаю</h2>
  <div class="mt-8 grid gap-6 sm:grid-cols-2">
    {services.map((s) => (
      <article class="flex flex-col rounded-2xl border border-neutral-200 p-6">
        <h3 class="text-xl font-semibold">{s.title}</h3>
        <p class="mt-1 text-neutral-600">{s.lead}</p>
        <ul class="mt-4 space-y-2 text-neutral-700">
          {s.items.map((item) => <li class="flex gap-2"><span class="text-accent">•</span><span>{item}</span></li>)}
        </ul>
        {s.bots && (
          <div class="mt-5 rounded-xl bg-neutral-50 p-4" data-bots>
            <p class="text-sm font-medium text-neutral-500">Ещё боты</p>
            <ul class="mt-2 space-y-1 text-sm text-neutral-700">
              {bots.map((b) => <li><span class="font-medium">{b.name}</span> — {b.what}, {b.who}.</li>)}
            </ul>
          </div>
        )}
        <p class="mt-auto pt-5 text-sm text-neutral-500">Стоимость зависит от задачи — напишите, посчитаю за день.</p>
      </article>
    ))}
  </div>
</section>
```

`src/components/home/CaseCard.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { roleLabel } from '../../lib/cases';

interface Props { entry: CollectionEntry<'cases'> }
const { entry } = Astro.props;
const { data } = entry;
---
<a href={`/cases/${entry.id}/`} class="group block">
  <Image
    src={data.cover}
    alt={data.coverAlt}
    widths={[480, 960]}
    sizes="(max-width: 640px) 100vw, 480px"
    class="aspect-[16/10] w-full rounded-xl border border-neutral-200 object-cover object-top"
  />
  <p class="mt-3 text-sm text-neutral-500">{data.niche} · {roleLabel(data.role)}</p>
  <h3 class="text-lg font-semibold group-hover:text-accent">{data.title}</h3>
  <p class="mt-1 text-neutral-600">{data.result}</p>
</a>
```

`src/components/home/CaseGrid.astro`:
```astro
---
import { getCollection } from 'astro:content';
import { sortCases } from '../../lib/cases';
import CaseCard from './CaseCard.astro';

const cases = sortCases(await getCollection('cases'));
---
<section id="cases" class="mx-auto max-w-5xl px-4 py-16">
  <h2 class="text-3xl font-bold tracking-tight">Кейсы</h2>
  <p class="mt-2 text-neutral-600">Что уже сделано и как это работает у клиентов.</p>
  <div class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2">
    {cases.map((entry) => <CaseCard entry={entry} />)}
  </div>
</section>
```

`src/components/home/Process.astro`:
```astro
---
const steps = [
  ['Разговор и ТЗ', 'Обсуждаем задачу и фиксируем письменно, что и когда вы получите.'],
  ['Прототип и дизайн', 'Сначала схема страниц, потом макет. Правки — до разработки, пока они дешёвые.'],
  ['Разработка с показами', 'Каждую неделю показываю, что готово. Никаких сюрпризов в конце.'],
  ['Запуск, обучение, гарантия', 'Разворачиваю, показываю, как пользоваться, месяц правлю бесплатно.'],
];
---
<section id="process" class="mx-auto max-w-5xl px-4 py-16">
  <h2 class="text-3xl font-bold tracking-tight">Как работаем</h2>
  <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {steps.map(([title, text], i) => (
      <li class="rounded-2xl bg-neutral-50 p-6">
        <span class="text-sm font-semibold text-accent">{i + 1}</span>
        <h3 class="mt-1 text-lg font-semibold">{title}</h3>
        <p class="mt-2 text-neutral-600">{text}</p>
      </li>
    ))}
  </ol>
  <p class="mt-6 text-neutral-600">Честно про сроки: лендинг — 1–2 недели, сервис — от месяца.</p>
</section>
```

`src/components/home/Maintenance.astro`:
```astro
<section id="maintenance" class="mx-auto max-w-5xl px-4 py-16">
  <div class="rounded-2xl border-l-4 border-accent bg-neutral-50 p-8">
    <h2 class="text-3xl font-bold tracking-tight">Почему продукт без ведения не работает</h2>
    <p class="mt-4 max-w-3xl text-lg text-neutral-700">
      Сайт или бот — не разовая покупка. Без новых статей, рекламы и обновлений через полгода
      он перестаёт приводить клиентов: поиск отдаёт место тем, кто пишет и обновляется.
      Говорю это заранее, чтобы не было иллюзий.
    </p>
    <p class="mt-3 text-neutral-600">Могу вести сам или подключаться по необходимости.</p>
  </div>
</section>
```

`src/components/home/Tech.astro`:
```astro
---
import site from '../../../site.config.mjs';
---
<section id="tech" class="mx-auto max-w-5xl px-4 py-16">
  <h2 class="text-2xl font-bold tracking-tight">Для технических заказчиков</h2>
  <p class="mt-3 max-w-3xl text-neutral-700">
    Rust (Axum), React и TypeScript, PostgreSQL / MySQL, Telegram Bot API. Код и доступы остаются
    у вас: репозиторий, сервер и домен — на ваших аккаунтах.
  </p>
  <a href={site.github} rel="noopener" target="_blank" class="mt-3 inline-block text-accent hover:underline">GitHub ↗</a>
</section>
```

`src/components/home/Contacts.astro`:
```astro
---
import site from '../../../site.config.mjs';
import ContactButtons from '../ContactButtons.astro';
const where = [site.city, site.timezone].filter(Boolean).join(', ');
---
<section id="contacts" class="mx-auto max-w-5xl px-4 py-16">
  <h2 class="text-3xl font-bold tracking-tight">Написать</h2>
  <p class="mt-2 text-neutral-600">Опишите задачу в двух словах — отвечу в тот же день.</p>
  <ContactButtons class="mt-6" />
  {where && <p class="mt-4 text-sm text-neutral-500">{where}</p>}
</section>
```

- [ ] **Step 5: Assemble `src/pages/index.astro`**

```astro
---
import site from '../../site.config.mjs';
import Base from '../layouts/Base.astro';
import Hero from '../components/home/Hero.astro';
import Services from '../components/home/Services.astro';
import CaseGrid from '../components/home/CaseGrid.astro';
import Process from '../components/home/Process.astro';
import Maintenance from '../components/home/Maintenance.astro';
import Tech from '../components/home/Tech.astro';
import Contacts from '../components/home/Contacts.astro';
import { personJsonLd } from '../lib/seo';
---
<Base
  title={`${site.firstName} — сайты, сервисы и Telegram-боты под ключ`}
  description="Разработчик под ключ: сайты, личные кабинеты, Telegram-боты и Mini App. От дизайна до запуска и сопровождения, без агентских наценок."
  jsonLd={personJsonLd(site)}
>
  <main>
    <Hero />
    <Services />
    <CaseGrid />
    <Process />
    <Maintenance />
    <Tech />
    <Contacts />
  </main>
</Base>
```
`personJsonLd` does not exist yet — Task 7 adds it. For this task create a minimal `src/lib/seo.ts`:
```ts
export function personJsonLd(site: { name: string; site: string }) {
  return { '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: site.site };
}
```

- [ ] **Step 6: Build, test, look**

Run: `npm run build && npm run test:dist`
Expected: all home tests PASS (the `USERNAME` guard still fails).
Then `npm run dev` and open http://localhost:4321 — check the hero, cards, grid at 390 px and 1440 px widths. Fix spacing only if something overlaps; no redesign.

- [ ] **Step 7: Commit**

```bash
git add src/data/bots.ts src/components/home src/pages/index.astro src/lib/seo.ts tests/dist/pages.test.ts
git commit -m "feat: home page sections — offer, services, cases, process, maintenance, tech, contacts"
```

---

### Task 7: SEO — JSON-LD, robots.txt, sitemap check, 404 page

**Files:**
- Modify: `src/lib/seo.ts` (full version), `src/layouts/Base.astro` (no change needed if Task 1 was followed)
- Create: `tests/unit/seo.test.ts`, `src/pages/robots.txt.ts`, `src/pages/404.astro`, `tests/dist/seo.test.ts`

**Interfaces:**
- Produces: `personJsonLd(site): object` with `@type: Person`, `name`, `url`, `jobTitle`, `sameAs[]`, optional `email`. `/robots.txt` and `/404.html` in dist. Sitemap comes from `@astrojs/sitemap` (`sitemap-index.xml` + `sitemap-0.xml`).

- [ ] **Step 1: Write the failing unit test**

`tests/unit/seo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { personJsonLd } from '../../src/lib/seo';

const site = {
  site: 'https://example.ru',
  name: 'Даниил Есков',
  telegram: 'https://t.me/x',
  github: 'https://github.com/x',
  email: '',
};

describe('personJsonLd', () => {
  it('builds a schema.org Person with sameAs from configured profiles', () => {
    const ld = personJsonLd(site) as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Даниил Есков');
    expect(ld.url).toBe('https://example.ru');
    expect(ld.jobTitle).toBe('Fullstack-разработчик');
    expect(ld.sameAs).toEqual(['https://t.me/x', 'https://github.com/x']);
    expect('email' in ld).toBe(false);
  });

  it('adds email only when configured', () => {
    const ld = personJsonLd({ ...site, email: 'a@b.ru' }) as Record<string, unknown>;
    expect(ld.email).toBe('a@b.ru');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL — `jobTitle` undefined / `sameAs` undefined.

- [ ] **Step 3: Implement `src/lib/seo.ts`**

```ts
export interface PersonSource {
  site: string;
  name: string;
  telegram: string;
  github: string;
  email: string;
}

/** JSON-LD Person for the home and CV pages (spec §6 «SEO и качество»). */
export function personJsonLd(source: PersonSource): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: source.name,
    url: source.site,
    jobTitle: 'Fullstack-разработчик',
    sameAs: [source.telegram, source.github].filter(Boolean),
    ...(source.email ? { email: source.email } : {}),
  };
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write `src/pages/robots.txt.ts` and `src/pages/404.astro`**

```ts
import type { APIRoute } from 'astro';

// Absolute sitemap URL comes from `site` in astro.config — never hardcode the domain.
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

```astro
---
import Base from '../layouts/Base.astro';
import ContactButtons from '../components/ContactButtons.astro';
---
<Base title="Страница не найдена" description="Такой страницы нет.">
  <main class="mx-auto max-w-3xl px-4 py-24">
    <p class="text-sm text-neutral-500">404</p>
    <h1 class="mt-2 text-4xl font-bold">Такой страницы нет</h1>
    <p class="mt-4 text-neutral-600">Ссылка устарела или в адресе опечатка. <a href="/" class="text-accent hover:underline">На главную</a>.</p>
    <ContactButtons class="mt-8" />
  </main>
</Base>
```

- [ ] **Step 6: Write `tests/dist/seo.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { allHtmlFiles, exists, html, read } from './helpers';

describe('SEO output', () => {
  it.each(allHtmlFiles().filter((f) => f !== '404.html'))('%s has title, description, absolute canonical and og:image', (file) => {
    const $ = html(file);
    expect($('title').text().length).toBeGreaterThan(10);
    expect($('meta[name="description"]').attr('content')?.length).toBeGreaterThan(20);
    expect($('link[rel="canonical"]').attr('href')).toMatch(/^https:\/\//);
    expect($('meta[property="og:image"]').attr('content')).toMatch(/^https:\/\/.+\/og\/.+\.png$/);
  });

  it('home and cv carry a JSON-LD Person', () => {
    for (const file of ['index.html', 'cv/index.html']) {
      const ld = JSON.parse(html(file)('script[type="application/ld+json"]').first().html() ?? 'null');
      expect(ld?.['@type'], file).toBe('Person');
    }
  });

  it('ships sitemap, robots and 404', () => {
    expect(exists('sitemap-index.xml')).toBe(true);
    expect(read('sitemap-0.xml')).toContain('/cv/');
    expect(read('sitemap-0.xml')).toContain('/cases/illoca/');
    expect(read('robots.txt')).toMatch(/Sitemap: https:\/\/.+\/sitemap-index\.xml/);
    expect(exists('404.html')).toBe(true);
  });
});
```
(`cv/index.html` arrives in Task 9; until then that assertion fails — expected, do not weaken it.)

- [ ] **Step 7: Build and run dist tests**

Run: `npm run build && npm run test:dist`
Expected: everything except the `cv/index.html` JSON-LD line and the `USERNAME` guard PASSES.

- [ ] **Step 8: Commit**

```bash
git add src/lib/seo.ts tests/unit/seo.test.ts src/pages/robots.txt.ts src/pages/404.astro tests/dist/seo.test.ts
git commit -m "feat: JSON-LD Person, robots.txt, 404 page and SEO dist checks"
```

---

### Task 8: Open Graph images generated at build

**Files:**
- Create: `src/lib/og.ts`, `tests/unit/og.test.ts`, `src/pages/og/[slug].png.ts`, `tests/dist/og.test.ts`

**Interfaces:**
- Produces: `escapeXml(s)`, `wrapLines(text, maxChars): string[]`, `ogSvg({ title, subtitle, site }): string` (1200×630 SVG). Routes `/og/home.png`, `/og/cv.png`, `/og/<case-id>.png` — the names `Base.astro` (Task 1) and the case page (Task 4) already reference.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/og.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { escapeXml, ogSvg, wrapLines } from '../../src/lib/og';

describe('escapeXml', () => {
  it('escapes the five XML specials', () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });
});

describe('wrapLines', () => {
  it('breaks on spaces without exceeding the limit when a word fits', () => {
    expect(wrapLines('Сайты, сервисы и Telegram-боты, которые приносят клиентов', 28)).toEqual([
      'Сайты, сервисы и',
      'Telegram-боты, которые',
      'приносят клиентов',
    ]);
  });

  it('keeps an over-long single word on its own line', () => {
    expect(wrapLines('Суперкалифрагилистикэкспиалидоцmilitant x', 10)).toEqual(['Суперкалифрагилистикэкспиалидоцmilitant', 'x']);
  });
});

describe('ogSvg', () => {
  it('is a 1200×630 SVG with the escaped title and subtitle', () => {
    const svg = ogSvg({ title: 'A & B', subtitle: 'Кейс', site: 'example.ru' });
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('Кейс');
    expect(svg).toContain('example.ru');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/lib/og`.

- [ ] **Step 3: Implement `src/lib/og.ts`**

```ts
const XML_ESCAPES: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };

export function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (ch) => XML_ESCAPES[ch] ?? ch);
}

/** Greedy word wrap; a word longer than the limit stays whole on its own line. */
export function wrapLines(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface OgInput {
  title: string;
  subtitle: string;
  site: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

/** 1200×630 card: accent bar, wrapped title, subtitle, site name. Rasterised by sharp. */
export function ogSvg({ title, subtitle, site }: OgInput): string {
  const lines = wrapLines(title, 28).slice(0, 3);
  const fontSize = lines.length > 2 ? 56 : 64;
  const lineHeight = Math.round(fontSize * 1.15);
  const tspans = lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="18" height="630" fill="#2b4fd6"/>
  <text x="80" y="210" font-family='${FONT}' font-size="${fontSize}" font-weight="700" fill="#171717">${tspans}</text>
  <text x="80" y="520" font-family='${FONT}' font-size="32" fill="#525252">${escapeXml(subtitle)}</text>
  <text x="80" y="580" font-family='${FONT}' font-size="24" fill="#a3a3a3">${escapeXml(site)}</text>
</svg>`;
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm test`
Expected: PASS. If the `wrapLines` expectation differs by one word, the test is right and the greedy loop is wrong — compare `candidate.length` with `>`, not `>=`.

- [ ] **Step 5: Write the endpoint `src/pages/og/[slug].png.ts`**

```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import site from '../../../site.config.mjs';
import { ogSvg, type OgInput } from '../../lib/og';

const host = site.site.replace(/^https?:\/\//, '');

export const getStaticPaths: GetStaticPaths = async () => {
  const cases = await getCollection('cases', ({ data }) => !data.draft);
  const pages: Array<{ slug: string; props: OgInput }> = [
    { slug: 'home', props: { title: 'Сайты, сервисы и Telegram-боты, которые приносят клиентов', subtitle: `${site.firstName}, разработчик под ключ`, site: host } },
    { slug: 'cv', props: { title: `${site.name} — Fullstack-разработчик`, subtitle: 'Rust / React / Go / PHP', site: host } },
    ...cases.map((c) => ({ slug: c.id, props: { title: c.data.title, subtitle: c.data.niche, site: host } })),
  ];
  return pages.map(({ slug, props }) => ({ params: { slug }, props }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await sharp(Buffer.from(ogSvg(props as OgInput))).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
```

- [ ] **Step 6: Write `tests/dist/og.test.ts`**

```ts
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DIST, caseFrontmatters, exists } from './helpers';

const slugs = ['home', 'cv', ...caseFrontmatters().filter((c) => !c.draft).map((c) => c.slug)];

describe('OG images', () => {
  it.each(slugs)('og/%s.png is a 1200×630 PNG', async (slug) => {
    const path = `og/${slug}.png`;
    expect(exists(path), path).toBe(true);
    const meta = await sharp(resolve(DIST, path)).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
  });
});
```

- [ ] **Step 7: Build, test, look at one image**

Run: `npm run build && npm run test:dist`
Expected: OG tests PASS. Open `dist/og/home.png` with the Read tool: three lines of title, no clipped text. If the text renders in a fallback font with wrong widths, lower `maxChars` in `ogSvg` to 26 — do not add font files.

- [ ] **Step 8: Commit**

```bash
git add src/lib/og.ts tests/unit/og.test.ts src/pages/og/[slug].png.ts tests/dist/og.test.ts
git commit -m "feat: build-time Open Graph images for home, cv and cases"
```

---

### Task 9: CV data, validation and the `/cv` page

**Files:**
- Create: `src/data/cv.yaml`, `src/lib/cv.ts`, `tests/unit/cv.test.ts`, `src/pages/cv.astro`
- Modify: `tests/dist/pages.test.ts` (add a `cv` block)

**Interfaces:**
- Produces: `cvSchema` (zod), `type Cv`, `parseCv(text): Cv`, `loadCv(): Cv` (reads `src/data/cv.yaml`). YAML shape is shared with Task 10's Typst template — field names are the contract: `name, headline, summary, contacts{telegram,email,site,github}, location, stack[{group,items[]}], experience[{period,role,org,points[]}], projects[{name,line,stack}], education[{period,place,degree}], languages[]`.

- [ ] **Step 1: Write `src/data/cv.yaml`** (facts known today; Task 13 fills the rest)

```yaml
name: Даниил Есков
headline: Fullstack-разработчик · Rust / React / Go / PHP
summary: >
  4+ года коммерческой разработки. Делаю продукт целиком: фронт, бэк, боты,
  инфраструктура и запуск. Работал с малым бизнесом и продуктовыми командами,
  привык отвечать за результат, а не за отдельный слой.
contacts:
  telegram: https://t.me/timbelan
  email: ""
  site: https://USERNAME.github.io
  github: https://github.com/USERNAME
location: ""
stack:
  - group: Бэкенд
    items: [Rust (Axum, SQLx), Go, PHP (Laravel), REST, WebSocket]
  - group: Фронтенд
    items: [React, TypeScript, Vue 3, Nuxt, Tailwind CSS, three.js]
  - group: Данные и инфраструктура
    items: [PostgreSQL, MySQL / MariaDB, Redis, nginx, Linux, GitHub Actions]
  - group: Боты и интеграции
    items: [Telegram Bot API, Mini Apps, платёжные API, OAuth]
experience:
  - period: 2022 — 2026
    role: Fullstack-разработчик, проекты под ключ
    org: ""
    points:
      - Спроектировал и запустил платформу онлайн-образования — кабинеты, оплаты, PDF-отчёты, Telegram-бот и Mini App (Rust, Vue, MariaDB).
      - Собрал закрытую аналитическую платформу по футболу и киберспорту — сбор статистики и прогнозы; передал заказчику с кодом и документацией.
      - Сделал сервис с подпиской ARB365 — сайт, кабинет, оплата криптовалютой, Telegram-бот.
      - Реализовал фронтенд illoca с WebGL-сценами и шейдерами (Nuxt 3, three.js, GSAP).
      - Разработал корпоративные сайты с админками для турфирмы и энергетической компании.
projects:
  - name: illoca
    line: сайт-презентация с 3D-сценами
    stack: Nuxt 3, three.js, GLSL, GSAP
  - name: Платформа онлайн-образования
    line: кабинеты, оплаты, отчёты, бот, Mini App
    stack: Rust (Axum), Vue 3, MariaDB, Redis
  - name: Аналитическая платформа (NDA)
    line: статистика матчей и прогнозы
    stack: Go, PostgreSQL, React
  - name: ARB365
    line: сервис с подпиской и ботом
    stack: PHP, MySQL, Telegram Bot API
education:
  - period: ""
    place: ""
    degree: Высшее, информационная безопасность
languages:
  - Русский — родной
  - Английский — технический
```

- [ ] **Step 2: Write the failing unit test**

`tests/unit/cv.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { loadCv, parseCv } from '../../src/lib/cv';

describe('parseCv', () => {
  it('rejects a document without a name', () => {
    expect(() => parseCv('headline: x\nsummary: y\n')).toThrow();
  });
});

describe('src/data/cv.yaml', () => {
  const cv = loadCv();

  it('validates against the schema and keeps the fixed headline', () => {
    expect(cv.headline).toBe('Fullstack-разработчик · Rust / React / Go / PHP');
    expect(cv.stack.length).toBeGreaterThanOrEqual(3);
  });

  it('writes experience in the past tense', () => {
    // No `\b` here: JS word boundaries are ASCII-only and never fire around Cyrillic letters.
    const presentTense = /(^|[^а-яё])(сейчас|работаю|делаю|занимаюсь)([^а-яё]|$)|в настоящее время/i;
    for (const job of cv.experience) {
      for (const point of job.points) expect(point, point).not.toMatch(presentTense);
    }
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/lib/cv`.

- [ ] **Step 4: Implement `src/lib/cv.ts`**

```ts
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { z } from 'zod';

// The YAML is also read by cv/resume.typ — field names here are the shared contract.
export const cvSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  contacts: z.object({
    telegram: z.url(),
    email: z.string(),
    site: z.url(),
    github: z.url(),
  }),
  location: z.string(),
  stack: z.array(z.object({ group: z.string().min(1), items: z.array(z.string().min(1)).min(1) })).min(1),
  experience: z
    .array(z.object({ period: z.string().min(1), role: z.string().min(1), org: z.string(), points: z.array(z.string().min(1)).min(1) }))
    .min(1),
  projects: z.array(z.object({ name: z.string().min(1), line: z.string().min(1), stack: z.string().min(1) })),
  education: z.array(z.object({ period: z.string(), place: z.string(), degree: z.string().min(1) })),
  languages: z.array(z.string().min(1)),
});

export type Cv = z.infer<typeof cvSchema>;

export function parseCv(text: string): Cv {
  return cvSchema.parse(yaml.load(text));
}

export function loadCv(): Cv {
  return parseCv(readFileSync(new URL('../data/cv.yaml', import.meta.url), 'utf8'));
}
```

- [ ] **Step 5: Run the unit tests**

Run: `npm test`
Expected: PASS (3 tests).

- [ ] **Step 6: Write `src/pages/cv.astro`**

```astro
---
import site from '../../site.config.mjs';
import Base from '../layouts/Base.astro';
import ContactButtons from '../components/ContactButtons.astro';
import { loadCv } from '../lib/cv';
import { personJsonLd } from '../lib/seo';

const cv = loadCv();
const h2 = 'mt-10 text-xl font-semibold tracking-tight print:mt-6';
---
<Base title={`${cv.name} — ${cv.headline}`} description={cv.summary.trim()} ogImage="/og/cv.png" jsonLd={personJsonLd(site)}>
  <main class="mx-auto max-w-3xl px-4 py-12 print:py-0">
    <header>
      <h1 class="text-4xl font-bold tracking-tight">{cv.name}</h1>
      <p class="mt-1 text-lg text-neutral-600">{cv.headline}</p>
      <div class="mt-5 flex flex-wrap items-center gap-3 print:hidden">
        <a href="/resume.pdf" download="Daniil_Eskov_CV.pdf" class="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">Скачать PDF</a>
        <ContactButtons />
      </div>
      <p class="mt-3 hidden text-sm text-neutral-600 print:block">
        {cv.contacts.telegram} · {cv.contacts.email} · {cv.contacts.site}
      </p>
    </header>

    <section>
      <h2 class={h2}>О себе</h2>
      <p class="mt-3 leading-relaxed text-neutral-700">{cv.summary}</p>
    </section>

    <section>
      <h2 class={h2}>Стек</h2>
      <dl class="mt-3 grid gap-2 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
        {cv.stack.map((g) => (
          <>
            <dt class="font-medium">{g.group}</dt>
            <dd class="text-neutral-700">{g.items.join(', ')}</dd>
          </>
        ))}
      </dl>
    </section>

    <section>
      <h2 class={h2}>Опыт</h2>
      {cv.experience.map((job) => (
        <article class="mt-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-semibold">{job.role}{job.org && <span class="font-normal text-neutral-600"> · {job.org}</span>}</h3>
            <span class="text-sm text-neutral-500">{job.period}</span>
          </div>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
            {job.points.map((p) => <li>{p}</li>)}
          </ul>
        </article>
      ))}
    </section>

    <section>
      <h2 class={h2}>Проекты</h2>
      <ul class="mt-3 space-y-2 text-neutral-700">
        {cv.projects.map((p) => (
          <li><span class="font-medium text-neutral-900">{p.name}</span> — {p.line}. <span class="text-neutral-500">{p.stack}</span></li>
        ))}
      </ul>
    </section>

    <section>
      <h2 class={h2}>Образование</h2>
      <ul class="mt-3 space-y-1 text-neutral-700">
        {cv.education.map((e) => (
          <li>
            <span class="font-medium text-neutral-900">{e.degree}</span>
            {e.place && ` — ${e.place}`}
            {e.period && <span class="text-neutral-500"> · {e.period}</span>}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h2 class={h2}>Языки</h2>
      <p class="mt-3 text-neutral-700">{cv.languages.join(', ')}</p>
    </section>
  </main>
</Base>
```

- [ ] **Step 7: Add the dist test**

Append to `tests/dist/pages.test.ts`:
```ts
describe('cv page', () => {
  const $ = html('cv/index.html');

  it('shows the name, the fixed headline and the PDF download with the fixed filename', () => {
    expect($('h1').first().text()).toBe('Даниил Есков');
    expect($('main').text()).toContain('Fullstack-разработчик · Rust / React / Go / PHP');
    const pdf = $('a[href="/resume.pdf"]');
    expect(pdf.attr('download')).toBe('Daniil_Eskov_CV.pdf');
  });

  it('has the sections in order', () => {
    const h2 = $('main h2').map((_, el) => $(el).text().trim()).get();
    expect(h2).toEqual(['О себе', 'Стек', 'Опыт', 'Проекты', 'Образование', 'Языки']);
  });
});
```

- [ ] **Step 8: Build and run dist tests**

Run: `npm run build && npm run test:dist`
Expected: `cv page` PASS, and the JSON-LD assertion from Task 7 now PASSES too. Open http://localhost:4321/cv/ via `npm run dev`, press `⌘P` — the header/footer/buttons are hidden, content fits 1–2 pages.

- [ ] **Step 9: Commit**

```bash
git add src/data/cv.yaml src/lib/cv.ts tests/unit/cv.test.ts src/pages/cv.astro tests/dist/pages.test.ts
git commit -m "feat: cv.yaml as single source with validation and the /cv page"
```

---

### Task 10: PDF résumé with Typst

**Files:**
- Create: `cv/resume.typ`, `tests/dist/pdf.test.ts`

**Interfaces:**
- Consumes: `src/data/cv.yaml` (field names from Task 9).
- Produces: `dist/resume.pdf` via `npm run pdf` (run **after** `npm run build`, because `astro build` empties `dist/`).

- [ ] **Step 1: Write the failing dist test**

`tests/dist/pdf.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, exists } from './helpers';

describe('resume.pdf', () => {
  it('exists and is a single-page PDF', () => {
    expect(exists('resume.pdf')).toBe(true);
    const bytes = readFileSync(resolve(DIST, 'resume.pdf'));
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pages = bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run test:dist`
Expected: FAIL — `resume.pdf` does not exist.

- [ ] **Step 3: Write `cv/resume.typ`** (verified 2026-09-04 with Typst 0.14.2: compiles to one page)

```typst
// One-page CV rendered from src/data/cv.yaml — the same file feeds /cv on the site.
// Compile from the repo root: typst compile --root . cv/resume.typ dist/resume.pdf
#let cv = yaml("/src/data/cv.yaml")

#set document(title: cv.name + " — " + cv.headline, author: cv.name)
#set page(paper: "a4", margin: (x: 1.6cm, y: 1.4cm))
#set text(font: "Libertinus Serif", size: 10pt, lang: "ru")
#set par(leading: 0.55em)
#show heading.where(level: 1): it => block(
  above: 1.1em, below: 0.5em,
  text(size: 10.5pt, weight: "bold", tracking: 0.06em, upper(it.body)),
)
#show link: set text(fill: rgb("#1d4ed8"))

#let muted = luma(90)
#let contacts = {
  let out = (link(cv.contacts.telegram, "Telegram"),)
  if cv.contacts.email != "" { out.push(link("mailto:" + cv.contacts.email, cv.contacts.email)) }
  out.push(link(cv.contacts.site, cv.contacts.site.replace("https://", "")))
  out.push(link(cv.contacts.github, "GitHub"))
  if cv.location != "" { out.push(cv.location) }
  out
}

#text(size: 20pt, weight: "bold")[#cv.name]
#v(-0.5em)
#text(size: 11pt, fill: muted)[#cv.headline]
#v(0.1em)
#contacts.join([ #h(0.4em) · #h(0.4em) ])

= О себе
#cv.summary

= Стек
#for g in cv.stack [
  *#g.group:* #g.items.join(", ") \
]

= Опыт
#for e in cv.experience [
  #block(above: 0.8em, below: 0.3em)[
    *#e.role* #h(1fr) #text(fill: muted)[#e.period]
    #if e.org != "" [ \ #text(fill: muted)[#e.org] ]
  ]
  #list(..e.points.map(p => [#p]))
]

= Проекты
#for p in cv.projects [
  - *#p.name* — #p.line. #text(fill: muted)[#p.stack]
]

= Образование
#for e in cv.education [
  *#e.degree*
  #if e.place != "" [ — #e.place ]
  #h(1fr) #text(fill: muted)[#e.period] \
]

= Языки
#cv.languages.join(", ")
```

- [ ] **Step 4: Compile and test**

Run: `npm run build && npm run pdf && npm run test:dist`
Expected: `typst` prints nothing (success), `pdf.test.ts` PASS. Then render a preview and look at it:
```bash
typst compile --root . --format png --ppi 80 cv/resume.typ /tmp/resume.png
```
Read `/tmp/resume.png`: name, headline, contacts line, six sections, everything on one page. If it spills to page 2 after Task 13 fills in real content, reduce `size: 10pt` to `9.5pt` first, margins second.

- [ ] **Step 5: Commit**

```bash
git add cv/resume.typ tests/dist/pdf.test.ts
git commit -m "feat: Typst résumé compiled from cv.yaml"
```

---

### Task 11: GitHub Actions → GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (deploy section)

**Interfaces:**
- Consumes: npm scripts from Task 1 (`test`, `check`, `build`, `pdf`, `test:dist`).
- Produces: a Pages deployment on every push to `main`. Nothing else depends on it.

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# One deployment at a time; a newer push cancels the queued one, never the running one.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run check
      - run: npm run build
      - uses: typst-community/setup-typst@v5
        with:
          typst-version: '0.14'
      # After `astro build` — it empties dist/ first.
      - run: npm run pdf
      - run: npm run test:dist
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Validate the YAML locally**

Run: `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/deploy.yml','utf8')); console.log('ok')"`
Expected: `ok`. Also run the same sequence the workflow runs, in one line, to be sure it is green end to end:
```bash
npm ci && npm test && npm run check && npm run build && npm run pdf && npm run test:dist
```
Expected: all green except `guards.test.ts` → `USERNAME` marker (until Task 13). That is the one expected red; everything else must pass.

- [ ] **Step 3: Document deploy in README**

Append to `README.md`:
```markdown
## Публикация

Сайт живёт на GitHub Pages. Каждый push в `main` запускает
`.github/workflows/deploy.yml`: юнит-тесты → `astro check` → `astro build` →
Typst собирает `resume.pdf` → тесты по `dist/` → выкладка. Красный шаг —
выкладки нет, прошлая версия остаётся.

Первый раз в настройках репозитория: **Settings → Pages → Source: GitHub
Actions**. Свой домен — файл `public/CNAME` с именем домена и в DNS четыре
A-записи GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153,
185.199.111.153) плюс `CNAME www → <логин>.github.io`.
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: build, test and deploy to GitHub Pages"
```

---

### Task 12: Yandex Metrika, `astro check`, Lighthouse and the visual pass

**Files:**
- Create: `src/components/Metrika.astro`
- Modify: `src/layouts/Base.astro` (mount Metrika), `tests/dist/seo.test.ts`, anything Lighthouse or the visual pass flags

**Interfaces:**
- Consumes: `site.metrikaId` (string, empty = no counter) from `site.config.mjs`.

- [ ] **Step 1: Write the dist test first**

Append to `tests/dist/seo.test.ts`:
```ts
import site from '../../site.config.mjs';

describe('metrika', () => {
  const $ = html('index.html');
  const scripts = $('script').map((_, el) => $(el).html() ?? '').get().join('\n');

  it('is present exactly when metrikaId is configured', () => {
    if (site.metrikaId) {
      expect(scripts).toContain('mc.yandex.ru/metrika/tag.js');
      expect(scripts).toContain(site.metrikaId);
      expect($('noscript img[src*="mc.yandex.ru/watch/"]').length).toBe(1);
    } else {
      expect(scripts).not.toContain('mc.yandex.ru');
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm run build && npm run test:dist -- seo`
Expected: PASS already (no id, no snippet). Now set `metrikaId: '12345678'` in `site.config.mjs` temporarily, rebuild, run again — FAIL: no snippet. That is the failing state we implement against.

- [ ] **Step 3: Write `src/components/Metrika.astro`**

```astro
---
// Standard Yandex Metrika tag. Rendered by Base only when site.metrikaId is set.
interface Props { id: string }
const { id } = Astro.props;
---
<script is:inline define:vars={{ id }}>
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  ym(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
</script>
<noscript><div><img src={`https://mc.yandex.ru/watch/${id}`} style="position:absolute; left:-9999px;" alt="" /></div></noscript>
```

- [ ] **Step 4: Mount it in `Base.astro`**

In the frontmatter of `src/layouts/Base.astro` add `import Metrika from '../components/Metrika.astro';` and, inside `<head>` after the JSON-LD block, add:
```astro
    {site.metrikaId && <Metrika id={site.metrikaId} />}
```

- [ ] **Step 5: Run the test both ways**

Run: `npm run build && npm run test:dist -- seo` with the temporary id → PASS. Restore `metrikaId: ''`, rebuild, run again → PASS. Leave the id empty (Task 13 fills the real one).

- [ ] **Step 6: `astro check` must be clean**

Run: `npm run check`
Expected: `0 errors, 0 warnings`. Fix every diagnostic it reports (typical ones: unused imports in `.astro` frontmatter, `Props` interfaces missing on components that receive props).

- [ ] **Step 7: Lighthouse**

```bash
npm run build && npm run preview &   # serves dist on http://localhost:4321
npx lighthouse http://localhost:4321/ --output=json --output-path=/tmp/lh-home.json --chrome-flags="--headless=new" --quiet
npx lighthouse http://localhost:4321/cases/illoca/ --output=json --output-path=/tmp/lh-case.json --chrome-flags="--headless=new" --quiet
node -e "for (const f of ['/tmp/lh-home.json','/tmp/lh-case.json']) { const r = require(f).categories; console.log(f, Object.fromEntries(Object.entries(r).map(([k,v]) => [k, Math.round(v.score*100)]))); }"
```
Expected: performance / accessibility / best-practices / seo — all 100 on both pages (the spec's target). Fix whatever is short. The usual suspects and their fixes:
- **Performance, LCP**: cover image on the home page or the case hero — add `loading="eager"` and `fetchpriority="high"` to the first `<Image>` above the fold; every other image `loading="lazy"`. Check `widths` on `<Image>` so mobile does not download the 1600 px file.
- **Performance, CLS**: `<Image>` from `astro:assets` already emits width/height; the React gallery thumbs get `width`/`height` from `shots` — make sure `Gallery.tsx` writes them to the `<img>`.
- **Accessibility, contrast**: `text-neutral-500` on white is borderline (4.6:1) — for body copy use `neutral-600` or darker; keep `neutral-500` only for ≥ 18 px text.
- **Accessibility, names**: every icon-only button has `aria-label`; links with the same text («Подробнее») lead to different hrefs — add `aria-label={`Кейс: ${title}`}` on `CaseCard`.
- **Best practices**: no console errors; no third-party cookies (Metrika is not loaded during the check while the id is empty).
- **SEO**: `<meta name="description">` present, `robots.txt` valid, tap targets ≥ 48 px on mobile — the contact buttons are `py-2.5` + text, make them `min-h-12`.

Kill the preview server afterwards (`kill %1`).

- [ ] **Step 8: Visual pass at 390 and 1440 px**

Run `npm run dev` and open http://localhost:4321/ , `/cases/illoca/`, `/cv/`, `/404` in a browser at **390 px** (iPhone) and **1440 px** widths. Check, and fix in place:
- no horizontal scroll at 390 px (`overflow-x` on `body` must not be needed — find the element that overflows instead: usually a long URL in a case page or the tech list without `flex-wrap`);
- the case grid is 1 column at 390, 2 at ≥ 768, 3 at ≥ 1280;
- the header links collapse into a single row of three short links at 390 px (no hamburger — three links fit);
- contact buttons stack vertically at 390 px, one row at 1440;
- the gallery lightbox: opens, arrows work, Escape closes, focus returns to the thumbnail;
- `/cv/` print preview (`⌘P`) — 1–2 pages, no buttons, no header/footer.

- [ ] **Step 9: Commit**

```bash
git add src/components/Metrika.astro src/layouts/Base.astro tests/dist/seo.test.ts
git add -u src   # only files you changed while fixing Lighthouse / visual findings; review `git status` first
git commit -m "feat: Metrika behind config, Lighthouse and responsive fixes"
```

---

### Task 13: Content interview, filling the config, first publish

No code in this task beyond editing data files. It is the only task that needs Daniil in the loop, so ask everything in **one** message, grouped, and wait.

**Files:**
- Modify: `site.config.mjs`, `src/data/cv.yaml`, `src/content/cases/*.md`, `src/assets/cases/**`, optionally `public/CNAME`

- [ ] **Step 1: Ask Daniil for the inputs — one message, this list**

1. **Идентификаторы.** GitHub-логин (репозиторий будет `<логин>.github.io`); ссылка на MAX (формат `https://max.ru/<ник>`); почта для кнопки «Почта» и для CV; город и часовой пояс (или «не указывать»); номер счётчика Яндекс.Метрики (или «завести новый»); домен `.ru` (если уже куплен) — иначе публикуем на `<логин>.github.io`. Фамилия в CV — «Есков» — верно?
2. **Скриншоты.** Для NDA-платформы (футбол/киберспорт): 2–3 экрана, где можно замазать бренд — или подтверждение, что кейс остаётся «только текст». Для ботов: по одному экрану диалога каждого бота (транскрибатор, парсер, лента заявок). Для образовательной платформы: ещё 2–3 экрана кроме главной (кабинет, отчёт, бот) — без названия и логотипа.
3. **По каждому кейсу — четыре вопроса:** с какой задачей пришёл заказчик; что сделал ты сам (а что было до тебя / делал кто-то ещё); что изменилось после запуска (цифра, факт, цитата — что есть); что было самым сложным. Кейсы: illoca, Оштен-Тур, платформа образования, ARB365, NDA-платформа, ЭкономЭнерго, боты.
4. **Для CV.** Хронология: где и когда работал/фрилансил с 2022 (названия компаний можно не называть — тогда «проекты под ключ»); вуз, годы, факультет; языки и уровень; хочешь ли строку «готов к переезду / удалёнка».

- [ ] **Step 2: Fill `site.config.mjs`**

Replace every `USERNAME` and empty string with the answers. `site` becomes `https://<логин>.github.io` (or `https://<домен>` when the domain is bought — then also create `public/CNAME` containing just the domain name, no protocol).

- [ ] **Step 3: Fill the content**

- `src/data/cv.yaml`: contacts (email, site, github), location, experience periods/orgs, education (period, place), languages — keep every experience point in the past tense (the unit test enforces it).
- `src/content/cases/*.md`: rewrite «Задача / Что сделал / Результат» from the answers; keep the three `##` headings exactly (`cases.test.ts` enforces them); add `year` when known.
- Replace grey placeholder covers with real screenshots (`scripts/shoot.sh` → `scripts/to-webp.mjs`; brand areas through `scripts/redact.mjs`; illoca — manual screenshots from Chrome, see Global Constraints). Fill `gallery` entries with `alt` texts that describe the screen, not the project («Кабинет ученика с прогрессом по курсу»).
- Flip `draft: false` on every case that got real content and covers. Skalisty Bereg stays `draft: true` until its PHP leak is fixed.

- [ ] **Step 4: Run everything green**

```bash
npm test && npm run check && npm run build && npm run pdf && npm run test:dist
```
Expected: **all green, including `guards.test.ts`** — the `USERNAME` marker is gone, no `mainexperts`/`October`/`<?php` in `dist/`. Check `resume.pdf` is still one page (`typst compile --root . --format png --ppi 80 cv/resume.typ /tmp/resume.png` and look).

- [ ] **Step 5: Commit**

```bash
git add site.config.mjs src/data/cv.yaml src/content/cases src/assets/cases public/CNAME
git commit -m "content: real owner data, case texts and screenshots"
```
(`public/CNAME` only if it exists.)

- [ ] **Step 6: Create the GitHub repository and enable Pages** (only after Daniil says «публикуй»)

```bash
gh repo create <логин>/<логин>.github.io --public --source=. --remote=origin
git push -u origin main
```
Then **Settings → Pages → Build and deployment → Source: GitHub Actions**. The first push already triggered the workflow; open **Actions**, wait for green, open `https://<логин>.github.io/`. Check `/cv/`, `/resume.pdf` (downloads as `Daniil_Eskov_CV.pdf`), `/cases/illoca/`, `/sitemap-index.xml`, `/robots.txt`.

- [ ] **Step 7: Domain (when bought)**

At the registrar: four `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `CNAME www → <логин>.github.io`. In **Settings → Pages → Custom domain** enter the domain, wait for the DNS check, tick **Enforce HTTPS**. Update `site` in `site.config.mjs`, commit, push — canonical URLs, sitemap and OG images switch to the domain on the next build. For mail on the domain — Yandex 360 for business (free tier): MX + SPF + DKIM records from its wizard.

---

## Self-review notes

- **Spec coverage.** Home page (hero, services, cases, process, maintenance, tech, contacts) — Task 6. Case pages with three sections, gallery, NDA, drafts — Tasks 4–5. `/cv` + `/resume.pdf` from one YAML — Tasks 9–10. SEO/OG/sitemap/robots/404 — Tasks 7–8. Metrika, Lighthouse 100, mobile — Task 12. CI on Pages — Task 11. Content and publish — Task 13. Screenshot pipeline and redaction — Task 3. Guards (no MainExperts / October / `<?php`, unfilled config, past tense) — Tasks 5, 9.
- **Deliberate gaps.** Dark theme, English, prices, forms, testimonials — excluded by the spec, not built. Skalisty Bereg remains a draft until its `<?php echo time();?>` leak is fixed on the live site.
- **Contracts across tasks.** `site.config.mjs` fields (`site,name,firstName,telegram,max,email,github,city,timezone,metrikaId`) are read by Tasks 2, 7, 9, 12. `Shot = {thumb,full,width,height,alt}` is produced in Task 4's `[id].astro` and consumed by `Gallery.tsx`. `caseFrontmatters()` from `tests/dist/helpers.ts` returns `{slug,title,draft,nda,url}` and is used by Tasks 4, 5, 7, 8. `cv.yaml` field names are shared by `lib/cv.ts`, `cv.astro` and `cv/resume.typ`. Section ids on the home page (`services,cases,process,maintenance,tech,contacts`) are used by the header links and the dist tests.
