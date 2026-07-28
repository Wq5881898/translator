import { describe, expect, it, vi } from 'vitest';

import {
  createChromeTranslationProvider,
  type BuiltInTranslatorApi,
} from './chrome-translation-provider';

function api(
  availability: 'available' | 'downloadable' | 'downloading' | 'unavailable',
  translatedText = '每天学习英语。',
): BuiltInTranslatorApi {
  return {
    availability: vi.fn(async () => availability),
    create: vi.fn(async () => ({
      translate: vi.fn(async () => translatedText),
    })),
  };
}

describe('ChromeTranslationProvider', () => {
  it('translates with the local English-to-Chinese model', async () => {
    const translatorApi = api('available');
    const provider = createChromeTranslationProvider(translatorApi);

    const result = await provider.translate({
      text: 'Learn English every day.',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result).toMatchObject({
      translatedText: '每天学习英语。',
      textKind: 'sentence',
      provider: 'chrome-local',
    });
    expect(translatorApi.create).toHaveBeenCalledWith({
      sourceLanguage: 'en',
      targetLanguage: 'zh',
    });
  });

  it('lets Chrome download a language pack when it is downloadable', async () => {
    const translatorApi = api('downloadable', '你好');
    const provider = createChromeTranslationProvider(translatorApi);

    const result = await provider.translate({
      text: 'hello',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result.translatedText).toBe('你好');
  });

  it('returns a clear unsupported-device error', async () => {
    const provider = createChromeTranslationProvider(api('unavailable'));

    await expect(
      provider.translate({
        text: 'A sentence.',
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      }),
    ).rejects.toThrow('does not support the English-to-Chinese language pack');
  });
});
