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
    const translatorApi = api('downloadable', '大家好。');
    const provider = createChromeTranslationProvider(translatorApi);

    const result = await provider.translate({
      text: 'Hello everyone.',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result.translatedText).toBe('大家好。');
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

  it('uses a dictionary headword and definitions for an inflected ambiguous word', async () => {
    const translate = vi.fn(async (text: string) => {
      const translations: Record<string, string> = {
        grant: '授予；批准',
        'To give or confer, with or without compensation, particularly in answer to prayer or request.':
          '给予或准予，尤其是回应请求',
        'To admit as true what is not yet generally accepted.': '承认某事属实',
      };
      return translations[text] ?? `unexpected:${text}`;
    });
    const translatorApi: BuiltInTranslatorApi = {
      availability: vi.fn(async () => 'available'),
      create: vi.fn(async () => ({ translate })),
    };
    const dictionaryFetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/granted')) {
        return new Response(
          JSON.stringify([{ word: 'granted', phonetic: '/ˈɡrɑːntɪd/' }]),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify([
          {
            word: 'grant',
            meanings: [
              {
                partOfSpeech: 'verb',
                definitions: [
                  {
                    definition:
                      'To give or confer, with or without compensation, particularly in answer to prayer or request.',
                  },
                ],
              },
              {
                partOfSpeech: 'verb',
                definitions: [
                  { definition: 'To admit as true what is not yet generally accepted.' },
                ],
              },
            ],
          },
        ]),
        { status: 200 },
      );
    });
    const provider = createChromeTranslationProvider(translatorApi, dictionaryFetcher);

    const result = await provider.translate({
      text: 'granted',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result.translatedText).toBe(
      '授予；批准；给予或准予，尤其是回应请求；承认某事属实',
    );
    expect(result.alternatives).toEqual([
      '授予；批准',
      '给予或准予，尤其是回应请求',
      '承认某事属实',
    ]);
    expect(result.phonetic).toBe('/ˈɡrɑːntɪd/');
    expect(translate).not.toHaveBeenCalledWith('granted');
  });
});

