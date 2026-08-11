import {
  validateEnglishTranslationInput,
  withTimeout,
} from '../core/translation-guard';
import {
  classifyText,
  type TranslationProvider,
  type TranslationRequest,
  type TranslationResult,
} from './translation-provider';
import {
  fetchEnglishDictionaryLookup,
  type FetchLike,
} from './free-dictionary-provider';

type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

type BuiltInTranslatorSession = {
  translate(text: string): Promise<string>;
  destroy?(): void;
};

export type BuiltInTranslatorApi = {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<Availability>;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<BuiltInTranslatorSession>;
};

function defaultApi(): BuiltInTranslatorApi | undefined {
  return (globalThis as typeof globalThis & { Translator?: BuiltInTranslatorApi }).Translator;
}

export function createChromeTranslationProvider(
  suppliedApi?: BuiltInTranslatorApi,
  dictionaryFetcher: FetchLike = fetch,
): TranslationProvider {
  let sessionPromise: Promise<BuiltInTranslatorSession> | undefined;

  async function getSession(): Promise<BuiltInTranslatorSession> {
    const api = suppliedApi ?? defaultApi();

    if (!api) {
      throw new Error(
        'Local translation is unavailable. Update desktop Chrome to version 138 or later.',
      );
    }

    const availability = await api.availability({
      sourceLanguage: 'en',
      targetLanguage: 'zh',
    });

    if (availability === 'unavailable') {
      throw new Error('Chrome does not support the English-to-Chinese language pack on this device.');
    }

    try {
      sessionPromise ??= api.create({
        sourceLanguage: 'en',
        targetLanguage: 'zh',
      });
      return await sessionPromise;
    } catch (error) {
      sessionPromise = undefined;

      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error(
          'Chrome needs a click to download the local language pack. Click Translate / retry.',
        );
      }

      throw error;
    }
  }

  return {
    async translate(request: TranslationRequest): Promise<TranslationResult> {
      const text = validateEnglishTranslationInput(request.text);
      const textKind = classifyText(text);
      const session = await withTimeout(getSession());
      const dictionaryResult =
        textKind === 'word'
          ? await withTimeout(
              fetchEnglishDictionaryLookup(text, dictionaryFetcher).catch(() => undefined),
              8_000,
              'Dictionary lookup timed out.',
            )
          : undefined;
      const translationInputs = dictionaryResult
        ? [dictionaryResult.headword, ...dictionaryResult.definitions]
        : [text];
      const translatedSenses = await Promise.all(
        translationInputs.map((input) => withTimeout(session.translate(input))),
      );
      const alternatives = translatedSenses
        .map((value) => value.trim())
        .filter(
          (value, index, values) =>
            value.length > 0 && values.indexOf(value) === index,
        )
        .slice(0, 3);
      const normalizedTranslation = alternatives.join('；');

      if (!normalizedTranslation) {
        throw new Error('Chrome returned an empty translation. Try again.');
      }

      return {
        originalText: text,
        translatedText: normalizedTranslation,
        textKind,
        provider: 'chrome-local',
        ...(dictionaryResult?.phonetic ? { phonetic: dictionaryResult.phonetic } : {}),
        ...(alternatives.length > 1 ? { alternatives } : {}),
      };
    },
  };
}

export const chromeTranslationProvider = createChromeTranslationProvider();
