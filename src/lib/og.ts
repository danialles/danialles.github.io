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
  // Astro's GetStaticPaths requires props to satisfy Record<string, unknown>.
  [key: string]: unknown;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
// Mirrors --color-accent from global.css: librsvg (sharp's SVG engine) does not understand oklch().
const ACCENT = '#2b4fd6';

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
  <rect width="18" height="630" fill="${ACCENT}"/>
  <text x="80" y="210" font-family='${FONT}' font-size="${fontSize}" font-weight="700" fill="#171717">${tspans}</text>
  <text x="80" y="520" font-family='${FONT}' font-size="32" fill="#525252">${escapeXml(subtitle)}</text>
  <text x="80" y="580" font-family='${FONT}' font-size="24" fill="#a3a3a3">${escapeXml(site)}</text>
</svg>`;
}
