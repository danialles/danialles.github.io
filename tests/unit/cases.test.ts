import { describe, expect, it } from 'vitest';
import { roleLabel, sortCases } from '../../src/lib/cases';

describe('roleLabel', () => {
  it('maps the three roles to the labels from the spec', () => {
    expect(roleLabel('front')).toBe('фронт');
    expect(roleLabel('fullstack')).toBe('фронт + бэк');
    expect(roleLabel('turnkey')).toBe('под ключ');
  });
});

describe('sortCases', () => {
  it('drops drafts and orders by `order` ascending', () => {
    const entries = [
      { id: 'b', data: { order: 20, draft: false } },
      { id: 'd', data: { order: 5, draft: true } },
      { id: 'a', data: { order: 10, draft: false } },
    ];
    expect(sortCases(entries).map((e) => e.id)).toEqual(['a', 'b']);
  });
});
