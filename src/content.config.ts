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
