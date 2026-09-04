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
