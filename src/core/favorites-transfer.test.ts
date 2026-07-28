import { describe, expect, it } from 'vitest';

import type { FavoriteEntry } from './favorites';
import {
  mergeFavorites,
  parseFavoritesCsv,
  serializeFavoritesCsv,
} from './favorites-transfer';

const word: FavoriteEntry = {
  id: 'word:hello',
  kind: 'word',
  originalText: 'Hello',
  translatedText: '你好，世界',
  firstFavoritedAt: '2026-07-28T10:00:00.000Z',
  phonetic: '/həˈləʊ/',
};

const sentence: FavoriteEntry = {
  id: 'sentence:He said "hello".',
  kind: 'sentence',
  originalText: 'He said "hello".',
  translatedText: '他说：“你好”。',
  firstFavoritedAt: '2026-07-28T11:00:00.000Z',
};

describe('favorites CSV transfer', () => {
  it('round-trips an Excel-friendly CSV with commas and quotes', () => {
    const text = serializeFavoritesCsv([word, sentence]);

    expect(text.startsWith('\uFEFFType,English,Phonetic,Chinese translation,First saved')).toBe(true);
    expect(parseFavoritesCsv(text)).toEqual([word, sentence]);
  });

  it('rejects unrelated or malformed CSV without partial data', () => {
    expect(() => parseFavoritesCsv('name,value\nhello,你好')).toThrow(
      'valid Translator favorites CSV file',
    );
    expect(() =>
      parseFavoritesCsv(
        'Type,English,Phonetic,Chinese translation,First saved\nword,hello,,你好,not-a-date',
      ),
    ).toThrow('invalid favorite row');
  });

  it('normalizes imported ids and removes duplicates', () => {
    const imported = parseFavoritesCsv(
      'Type,English,Phonetic,Chinese translation,First saved\n' +
        'word,Hello,/həˈləʊ/,你好,2026-07-28T10:00:00.000Z\n' +
        'word, hello ,/həˈləʊ/,您好,2026-07-28T12:00:00.000Z\n',
    );

    expect(imported).toHaveLength(1);
    expect(imported[0]?.id).toBe('word:hello');
  });

  it('merges new entries while preserving existing entries', () => {
    expect(mergeFavorites([word], [{ ...word, translatedText: 'different' }, sentence])).toEqual([
      word,
      sentence,
    ]);
  });
});
