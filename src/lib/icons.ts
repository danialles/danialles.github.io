// One stroke set for the whole site: 24×24 grid, 1.5px stroke, no fills — so the icons read
// as one family rather than as clip-art collected from different packs.
export const iconPaths = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3.6 3 14.4 0 18"/><path d="M12 3c-3 3.6-3 14.4 0 18"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8.5 10.5h.01"/><path d="M12 10.5h.01"/><path d="M15.5 10.5h.01"/>',
  panel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  growth: '<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h7"/><path d="M21 8v7"/>',
  wireframe: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  code: '<path d="M9 8l-5 4 5 4"/><path d="M15 8l5 4-5 4"/>',
  launch: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
} as const;

export type IconName = keyof typeof iconPaths;
