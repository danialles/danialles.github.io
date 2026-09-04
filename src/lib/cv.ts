import yaml from 'js-yaml';
import { z } from 'zod';
// `?raw` inlines the file content at build time. Astro's prerender step bundles
// this module into dist/.prerender/chunks/*, which relocates it relative to
// import.meta.url — a plain readFileSync(new URL(...)) 404s there even though
// it works in dev. Inlining sidesteps the mismatch entirely.
import cvYamlText from '../data/cv.yaml?raw';

// The YAML is also read by cv/resume.typ — field names here are the shared contract.
export const cvSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  contacts: z.object({
    telegram: z.url(),
    phone: z.string(),
    email: z.union([z.email(), z.literal('')]),
    site: z.url(),
    github: z.union([z.url(), z.literal('')]),
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
  return parseCv(cvYamlText);
}
