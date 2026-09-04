export interface ContactConfig {
  telegram: string;
  max: string;
  phone: string;
  email: string;
}

export interface ContactLink {
  kind: 'telegram' | 'max' | 'phone' | 'email';
  label: string;
  href: string;
}

/**
 * Buttons in the order the spec fixes: Telegram, MAX, email — with the phone sitting
 * between MAX and email. MAX has no "write to this number" URL at all (only a
 * max.ru/u/<code> profile link copied from the app), so a number cannot become a MAX
 * button and stands on its own as `tel:`. Empty config = no button.
 */
export function contactLinks(config: ContactConfig): ContactLink[] {
  const links: ContactLink[] = [];
  if (config.telegram) links.push({ kind: 'telegram', label: 'Telegram', href: config.telegram });
  if (config.max) links.push({ kind: 'max', label: 'MAX', href: config.max });
  if (config.phone) links.push({ kind: 'phone', label: 'Позвонить', href: `tel:${config.phone.replace(/[^+\d]/g, '')}` });
  if (config.email) links.push({ kind: 'email', label: 'Почта', href: `mailto:${config.email}` });
  return links;
}
