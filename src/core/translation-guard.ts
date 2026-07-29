export const MAX_TRANSLATION_CHARACTERS = 5000;
export const TRANSLATION_TIMEOUT_MS = 20_000;

export function validateEnglishTranslationInput(text: string): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();

  if (!normalized) {
    throw new Error('Select some English text to translate.');
  }

  if (normalized.length > MAX_TRANSLATION_CHARACTERS) {
    throw new Error(
      `The selected text is too long. Select no more than ${MAX_TRANSLATION_CHARACTERS} characters.`,
    );
  }

  if (!/[A-Za-z]/u.test(normalized)) {
    throw new Error('The selection does not appear to contain English text.');
  }

  return normalized;
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs = TRANSLATION_TIMEOUT_MS,
  message = 'Translation timed out. Check your connection or try again.',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
