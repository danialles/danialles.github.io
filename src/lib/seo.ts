export function personJsonLd(site: { name: string; site: string }) {
  return { '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: site.site };
}
