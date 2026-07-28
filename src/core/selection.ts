export const MAX_SELECTION_LENGTH = 5_000;

export function normalizeSelection(value: string): string {
  return value.replace(/\s+/gu, ' ').trim().slice(0, MAX_SELECTION_LENGTH);
}
