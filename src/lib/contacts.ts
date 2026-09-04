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
