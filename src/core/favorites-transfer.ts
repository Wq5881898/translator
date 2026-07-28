import type { FavoriteEntry, FavoriteKind } from './favorites';

const EXPORT_FORMAT = 'translator-favorites';
const EXPORT_VERSION = 1;

export type FavoritesExport = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  favorites: FavoriteEntry[];
};

function normalizedId(text: string, kind: FavoriteKind): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  return `${kind}:${kind === 'word' ? normalized.toLocaleLowerCase('en') : normalized}`;
}

function parseFavorite(value: unknown): FavoriteEntry {
  if (!value || typeof value !== 'object') {
    throw new Error('The file contains an invalid favorite.');
  }

  const item = value as Record<string, unknown>;
  const kind = item.kind;
  const originalText = typeof item.originalText === 'string' ? item.originalText.trim() : '';
  const translatedText =
    typeof item.translatedText === 'string' ? item.translatedText.trim() : '';
  const firstFavoritedAt =
    typeof item.firstFavoritedAt === 'string' ? item.firstFavoritedAt : '';

  if (
    (kind !== 'word' && kind !== 'sentence') ||
    !originalText ||
    !translatedText ||
    !firstFavoritedAt ||
    Number.isNaN(Date.parse(firstFavoritedAt))
  ) {
    throw new Error('The file contains an invalid favorite.');
  }

  const phonetic = typeof item.phonetic === 'string' ? item.phonetic.trim() : '';

  return {
    id: normalizedId(originalText, kind),
    kind,
    originalText,
    translatedText,
    firstFavoritedAt,
    ...(phonetic ? { phonetic } : {}),
  };
}

export function serializeFavorites(
  favorites: FavoriteEntry[],
  exportedAt = new Date().toISOString(),
): string {
  const payload: FavoritesExport = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt,
    favorites,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseFavoritesExport(text: string): FavoriteEntry[] {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Choose a valid Translator favorites JSON file.');
  }

  if (!value || typeof value !== 'object') {
    throw new Error('Choose a valid Translator favorites JSON file.');
  }

  const payload = value as Record<string, unknown>;
  if (
    payload.format !== EXPORT_FORMAT ||
    payload.version !== EXPORT_VERSION ||
    !Array.isArray(payload.favorites)
  ) {
    throw new Error('This file is not a supported Translator favorites export.');
  }

  const unique = new Map<string, FavoriteEntry>();
  for (const value of payload.favorites) {
    const favorite = parseFavorite(value);
    if (!unique.has(favorite.id)) {
      unique.set(favorite.id, favorite);
    }
  }

  return [...unique.values()];
}

export function mergeFavorites(
  current: FavoriteEntry[],
  imported: FavoriteEntry[],
): FavoriteEntry[] {
  const merged = new Map(current.map((favorite) => [favorite.id, favorite]));

  for (const favorite of imported) {
    if (!merged.has(favorite.id)) {
      merged.set(favorite.id, favorite);
    }
  }

  return [...merged.values()];
}
