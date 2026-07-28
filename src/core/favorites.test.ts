import { describe, expect, it } from 'vitest';

import { addFavorite, favoriteId, findFavorite, removeFavorite } from './favorites';
import type { TranslationResult } from '../providers/translation-provider';

const word: TranslationResult = {
  originalText: 'Hello',
  translatedText: '你好',
  textKind: 'word',
  provider: 'chrome-local',
  phonetic: '/həˈləʊ/',
};

const sentence: TranslationResult = {
  originalText: 'Learn English every day.',
  translatedText: '每天学习英语。',
  textKind: 'sentence',
  provider: 'chrome-local',
};

describe('favorites', () => {
  it('stores a word with phonetics and the first favorite time', () => {
    const favorites = addFavorite([], word, '2026-07-28T12:00:00.000Z');

    expect(favorites).toEqual([
      {
        id: 'word:hello',
        kind: 'word',
        originalText: 'Hello',
        translatedText: '你好',
        phonetic: '/həˈləʊ/',
        firstFavoritedAt: '2026-07-28T12:00:00.000Z',
      },
    ]);
  });

  it('stores non-word text in the sentence list', () => {
    const favorites = addFavorite([], sentence, '2026-07-28T12:00:00.000Z');

    expect(favorites[0]).toMatchObject({
      kind: 'sentence',
      originalText: 'Learn English every day.',
      translatedText: '每天学习英语。',
    });
  });

  it('does not duplicate an existing favorite or replace its first time', () => {
    const first = addFavorite([], word, '2026-07-28T12:00:00.000Z');
    const second = addFavorite(first, { ...word, originalText: 'hello' }, '2026-07-29T12:00:00.000Z');

    expect(second).toBe(first);
    expect(findFavorite(second, word)?.firstFavoritedAt).toBe(
      '2026-07-28T12:00:00.000Z',
    );
  });

  it('removes one favorite by its stable id', () => {
    const favorites = addFavorite(
      addFavorite([], sentence, '2026-07-28T12:00:00.000Z'),
      word,
      '2026-07-28T12:00:00.000Z',
    );

    expect(removeFavorite(favorites, favoriteId(word))).toEqual([
      expect.objectContaining({ kind: 'sentence' }),
    ]);
  });
});
