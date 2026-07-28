import type { TranslatorSettings } from '../core/settings';
import {
  classifyText,
  type TranslationProvider,
  type TranslationRequest,
  type TranslationResult,
} from './translation-provider';
import { fetchEnglishPhonetic } from './free-dictionary-provider';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type AzureSettings = Pick<TranslatorSettings, 'azureKey' | 'azureRegion'>;

type TranslateResponse = Array<{
  translations?: Array<{
    text?: string;
  }>;
}>;

type DictionaryResponse = Array<{
  translations?: Array<{
    displayTarget?: string;
  }>;
}>;

const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

function headers(settings: AzureSettings): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    'Ocp-Apim-Subscription-Key': settings.azureKey,
    'Ocp-Apim-Subscription-Region': settings.azureRegion,
  };
}

async function azureRequest<T>(
  path: string,
  text: string,
  settings: AzureSettings,
  fetcher: FetchLike,
): Promise<T> {
  const response = await fetcher(`${AZURE_ENDPOINT}${path}`, {
    method: 'POST',
    headers: headers(settings),
    body: JSON.stringify([{ Text: text }]),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Azure rejected the key or region.');
    }

    if (response.status === 403) {
      throw new Error('Azure denied the request or the free quota is unavailable.');
    }

    if (response.status === 429) {
      throw new Error('Azure request limit reached. Try again shortly.');
    }

    throw new Error(`Azure translation failed (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

async function translateText(
  text: string,
  settings: AzureSettings,
  fetcher: FetchLike,
): Promise<string> {
  const response = await azureRequest<TranslateResponse>(
    '/translate?api-version=3.0&from=en&to=zh-Hans',
    text,
    settings,
    fetcher,
  );
  const translatedText = response[0]?.translations?.[0]?.text?.trim();

  if (!translatedText) {
    throw new Error('Azure returned an empty translation.');
  }

  return translatedText;
}

async function lookupWord(
  word: string,
  settings: AzureSettings,
  fetcher: FetchLike,
): Promise<string[]> {
  const response = await azureRequest<DictionaryResponse>(
    '/dictionary/lookup?api-version=3.0&from=en&to=zh-Hans',
    word,
    settings,
    fetcher,
  );
  const values = response[0]?.translations
    ?.map((item) => item.displayTarget?.trim())
    .filter((item): item is string => Boolean(item));

  return [...new Set(values ?? [])].slice(0, 5);
}

export function createAzureTranslationProvider(
  settings: AzureSettings,
  fetcher: FetchLike = fetch,
): TranslationProvider {
  return {
    async translate(request: TranslationRequest): Promise<TranslationResult> {
      const text = request.text.trim();

      if (!text) {
        throw new Error('Text is required.');
      }

      const textKind = classifyText(text);

      if (textKind !== 'word') {
        return {
          originalText: text,
          translatedText: await translateText(text, settings, fetcher),
          textKind,
          provider: 'azure',
        };
      }

      const [dictionaryResult, phoneticResult] = await Promise.allSettled([
        lookupWord(text, settings, fetcher),
        fetchEnglishPhonetic(text, fetcher),
      ]);
      const alternatives =
        dictionaryResult.status === 'fulfilled' ? dictionaryResult.value : [];
      const phonetic =
        phoneticResult.status === 'fulfilled' ? phoneticResult.value : undefined;
      const translatedText =
        alternatives.length > 0
          ? alternatives.join('；')
          : await translateText(text, settings, fetcher);

      return {
        originalText: text,
        translatedText,
        textKind,
        provider: 'azure',
        ...(phonetic ? { phonetic } : {}),
        ...(alternatives.length > 0 ? { alternatives } : {}),
      };
    },
  };
}
