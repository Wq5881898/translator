import { describe, expect, it } from 'vitest';

import type { FavoriteEntry } from './favorites';
import {
  mergeFavorites,
  parseFavoritesExport,
  serializeFavorites,
} from './favorites-transfer';

const word: FavoriteEntry = {
  id: 'word:hello',
  kind: 'word',
  originalText: 'Hello',
  translatedText: '你好',
  firstFavoritedAt: '2026-07-28T10:00:00.000Z',
  phonetic: '/həˈləʊ/',
};

const sentence: FavoriteEntry = {
  id: 'sentence:How are you?',
  kind: 'sentence',
  originalText: 'How are you?',
  translatedText: '你好吗？',
  firstFavoritedAt: '2026-07-28T11:00:00.000Z',
};

describe('favorites transfer', () => {
  it('round-trips a versioned local export', () => {
    const text = serializeFavorites(
      [word, sentence],
      '2026-07-28T12:00:00.000Z',
    );

    expect(parseFavoritesExport(text)).toEqual([word, sentence]);
  });

  it('rejects unsupported files without returning partial data', () => {
    expect(() => parseFavoritesExport('{"favorites":[]}')).toThrow(
      'not a supported Translator favorites export',
    );
    expect(() => parseFavoritesExport('not json')).toThrow(
      'valid Translator favorites JSON file',
    );
  });

  it('normalizes imported ids and removes duplicates', () => {
    const imported = parseFavoritesExport(
      JSON.stringify({
        format: 'translator-favorites',
        version: 1,
        favorites: [word, { ...word, id: 'untrusted-id', originalText: ' hello ' }],
      }),
    );

    expect(imported).toEqual([word]);
  });

  it('merges new entries while preserving existing entries', () => {
    expect(mergeFavorites([word], [{ ...word, translatedText: 'different' }, sentence])).toEqual([
      word,
      sentence,
    ]);
  });
});
