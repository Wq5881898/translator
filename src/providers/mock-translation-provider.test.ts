import { describe, expect, it } from 'vitest';

import { mockTranslationProvider } from './mock-translation-provider';

describe('mockTranslationProvider', () => {
  it('returns a predictable result for the foundation check', async () => {
    const result = await mockTranslationProvider.translate({
      text: 'hello',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result).toMatchObject({
      originalText: 'hello',
      translatedText: '你好',
      textKind: 'word',
      provider: 'mock',
    });
  });

  it('rejects empty input', async () => {
    await expect(
      mockTranslationProvider.translate({
        text: '   ',
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      }),
    ).rejects.toThrow('Text is required.');
  });
});
