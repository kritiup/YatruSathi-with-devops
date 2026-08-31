import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, toList } from './formatters';

describe('toList', () => {
  it('returns a bare array unchanged', () => {
    expect(toList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('unwraps a paginated { results } envelope', () => {
    expect(toList({ count: 1, results: ['a'] })).toEqual(['a']);
  });

  it('returns [] for anything else', () => {
    expect(toList(null)).toEqual([]);
    expect(toList({})).toEqual([]);
    expect(toList('nope')).toEqual([]);
  });
});

describe('formatCurrency', () => {
  it('prefixes the currency code and keeps the digits', () => {
    const out = formatCurrency(1000);
    expect(out.startsWith('NPR ')).toBe(true);
    expect(out.replace(/[^0-9]/g, '')).toBe('1000');
  });

  it('returns "" for empty / non-numeric input', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency('')).toBe('');
    expect(formatCurrency('abc')).toBe('');
  });
});

describe('formatDate', () => {
  it('returns "" for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });

  it('formats a valid ISO date to a non-empty string', () => {
    expect(formatDate('2026-03-14T00:00:00Z').length).toBeGreaterThan(0);
  });
});
