export type Role = 'front' | 'fullstack' | 'turnkey';

const ROLE_LABELS: Record<Role, string> = {
  front: 'фронт',
  fullstack: 'фронт + бэк',
  turnkey: 'под ключ',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

/** Grid order: drafts never show, the rest by `order` ascending. */
export function sortCases<T extends { data: { order: number; draft: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => !e.data.draft).sort((a, b) => a.data.order - b.data.order);
}
