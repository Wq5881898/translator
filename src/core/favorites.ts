import type { TranslationResult } from '../providers/translation-provider';

export const FAVORITES_STORAGE_KEY = 'translatorFavorites';

export type FavoriteKind = 'word' | 'sentence';

export type FavoriteEntry = {
  id: string;
  kind: FavoriteKind;
  originalText: string;
  translatedText: string;
  firstFavoritedAt: string;
  phonetic?: string;
};

function favoriteKind(result: TranslationResult): FavoriteKind {
  return result.textKind === 'word' ? 'word' : 'sentence';
}

function normalizedIdentityText(text: string, kind: FavoriteKind): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  return kind === 'word' ? normalized.toLocaleLowerCase('en') : normalized;
}

export function favoriteId(result: TranslationResult): string {
  const kind = favoriteKind(result);
  return `${kind}:${normalizedIdentityText(result.originalText, kind)}`;
}

export function findFavorite(
  favorites: FavoriteEntry[],
  result: TranslationResult,
): FavoriteEntry | undefined {
  const id = favoriteId(result);
  return favorites.find((favorite) => favorite.id === id);
}

export function addFavorite(
  favorites: FavoriteEntry[],
  result: TranslationResult,
  firstFavoritedAt = new Date().toISOString(),
): FavoriteEntry[] {
  if (findFavorite(favorites, result)) {
    return favorites;
  }

  const entry: FavoriteEntry = {
    id: favoriteId(result),
    kind: favoriteKind(result),
    originalText: result.originalText,
    translatedText: result.translatedText,
    firstFavoritedAt,
    ...(result.phonetic ? { phonetic: result.phonetic } : {}),
  };

  return [entry, ...favorites];
}

export function removeFavorite(
  favorites: FavoriteEntry[],
  id: string,
): FavoriteEntry[] {
  return favorites.filter((favorite) => favorite.id !== id);
}
