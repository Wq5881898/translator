import { describe, expect, it, vi } from 'vitest';

import { createAzureTranslationProvider } from './azure-translation-provider';

const settings = {
  azureKey: 'test-key',
  azureRegion: 'westus2',
};

describe('AzureTranslationProvider', () => {
  it('translates a sentence with the Azure translate endpoint', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify([{ translations: [{ text: '每天学习英语。' }] }]),
        { status: 200 },
      ),
    );
    const provider = createAzureTranslationProvider(settings, fetcher);

    const result = await provider.translate({
      text: 'Learn English every day.',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result).toMatchObject({
      translatedText: '每天学习英语。',
      textKind: 'sentence',
      provider: 'azure',
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('combines Azure word meanings with a free IPA result', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes('dictionaryapi.dev')) {
        return new Response(JSON.stringify([{ phonetic: '/həˈləʊ/' }]), {
          status: 200,
        });
      }

      return new Response(
        JSON.stringify([
          {
            translations: [
              { displayTarget: '你好' },
              { displayTarget: '您好' },
            ],
          },
        ]),
        { status: 200 },
      );
    });
    const provider = createAzureTranslationProvider(settings, fetcher);

    const result = await provider.translate({
      text: 'hello',
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });

    expect(result).toMatchObject({
      translatedText: '你好；您好',
      phonetic: '/həˈləʊ/',
      alternatives: ['你好', '您好'],
      textKind: 'word',
    });
  });

  it('returns a clear authentication error', async () => {
    const provider = createAzureTranslationProvider(
      settings,
      vi.fn(async () => new Response('', { status: 401 })),
    );

    await expect(
      provider.translate({
        text: 'A sentence.',
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      }),
    ).rejects.toThrow('Azure rejected the key or region.');
  });
});
