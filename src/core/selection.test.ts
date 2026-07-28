import { describe, expect, it } from 'vitest';

import { MAX_SELECTION_LENGTH, normalizeSelection } from './selection';

describe('normalizeSelection', () => {
  it('normalizes whitespace from webpage selections', () => {
    expect(normalizeSelection('  Learn\n  English\t every day.  ')).toBe(
      'Learn English every day.',
    );
  });

  it('returns an empty string for an empty selection', () => {
    expect(normalizeSelection('  \n\t ')).toBe('');
  });

  it('limits unexpectedly large selections', () => {
    expect(normalizeSelection('a'.repeat(MAX_SELECTION_LENGTH + 20))).toHaveLength(
      MAX_SELECTION_LENGTH,
    );
  });
});
