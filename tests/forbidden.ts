/**
 * Words that must never reach anything published — neither the HTML in dist/ nor the
 * résumé PDF, which is built from src/data/cv.yaml + cv/resume.typ and therefore
 * never passes through the dist HTML guards (spec §2, §4, §6).
 */
export const FORBIDDEN: Array<[string, RegExp]> = [
  ['brand of the anonymous case', /mainexperts/i],
  ['CMS name hidden by positioning', /october\s*cms|\boctober\b/i],
  ['raw PHP leaked from a client site', /<\?php/],
  ['unfilled site.config value', /USERNAME/],
];
