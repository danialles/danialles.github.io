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
