import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import site from '../../../site.config.mjs';
import { loadCv } from '../../lib/cv';
import { ogSvg, type OgInput } from '../../lib/og';

const host = site.site.replace(/^https?:\/\//, '');

// The CV card says exactly what the résumé says. `headline` is "Роль · стек": the role
// finishes the card's title, the stack becomes its subtitle.
const cv = loadCv();
const [cvRole, ...cvStack] = cv.headline.split('·').map((part) => part.trim());

export const getStaticPaths: GetStaticPaths = async () => {
  const cases = await getCollection('cases', ({ data }) => !data.draft);
  const pages: Array<{ slug: string; props: OgInput }> = [
    { slug: 'home', props: { title: 'Сайты, сервисы и Telegram-боты, которые приносят клиентов', subtitle: `${site.firstName}, разработчик под ключ`, site: host } },
    { slug: 'cv', props: { title: `${cv.name} — ${cvRole}`, subtitle: cvStack.join(' · '), site: host } },
    ...cases.map((c) => ({ slug: c.id, props: { title: c.data.title, subtitle: c.data.niche, site: host } })),
  ];
  return pages.map(({ slug, props }) => ({ params: { slug }, props }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await sharp(Buffer.from(ogSvg(props as OgInput))).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
