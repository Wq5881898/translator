import { describe, expect, it, vi } from 'vitest';

import {
  MAX_TRANSLATION_CHARACTERS,
  validateEnglishTranslationInput,
  withTimeout,
} from './translation-guard';

describe('translation guard', () => {
  it('normalizes valid English input', () => {
    expect(validateEnglishTranslationInput('  Hello\n world  ')).toBe('Hello world');
  });

  it('rejects empty, non-English, and excessively long selections', () => {
    expect(() => validateEnglishTranslationInput('   ')).toThrow('Select some English text');
    expect(() => validateEnglishTranslationInput('你好世界')).toThrow(
      'does not appear to contain English',
    );
    expect(() =>
      validateEnglishTranslationInput('a'.repeat(MAX_TRANSLATION_CHARACTERS + 1)),
    ).toThrow('too long');
  });

  it('returns successful work before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('done'), 10)).resolves.toBe('done');
  });

  it('returns an understandable timeout error', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<string>(() => undefined), 100);
    const expectation = expect(result).rejects.toThrow('Translation timed out');
    await vi.advanceTimersByTimeAsync(100);
    await expectation;
    vi.useRealTimers();
  });
});
