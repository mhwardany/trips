import { describe, it, expect } from 'vitest';
import { safeExternalUrl } from '@/lib/utils';

describe('safeExternalUrl', () => {
  it('allows http(s) links', () => {
    expect(safeExternalUrl('https://example.com')).toBe('https://example.com');
    expect(safeExternalUrl('http://example.com/x')).toBe('http://example.com/x');
  });
  it('blocks javascript: and data: schemes', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBe('#');
    expect(safeExternalUrl('data:text/html,<script>')).toBe('#');
    expect(safeExternalUrl('')).toBe('#');
    expect(safeExternalUrl(undefined)).toBe('#');
  });
});
