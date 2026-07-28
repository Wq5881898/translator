export const TRANSLATOR_SETTINGS_KEY = 'translatorSettings';

export type PronunciationLanguage = 'en-US' | 'en-GB';

export type TranslatorSettings = {
  pronunciationLanguage: PronunciationLanguage;
  azureFallbackEnabled: boolean;
  azureKey: string;
  azureRegion: string;
};

export const DEFAULT_PRONUNCIATION_LANGUAGE: PronunciationLanguage = 'en-US';

export function isPronunciationLanguage(
  value: unknown,
): value is PronunciationLanguage {
  return value === 'en-US' || value === 'en-GB';
}

export function normalizeSettings(
  settings: Partial<TranslatorSettings>,
): TranslatorSettings {
  return {
    pronunciationLanguage: isPronunciationLanguage(settings.pronunciationLanguage)
      ? settings.pronunciationLanguage
      : DEFAULT_PRONUNCIATION_LANGUAGE,
    azureFallbackEnabled: settings.azureFallbackEnabled === true,
    azureKey: settings.azureKey?.trim() ?? '',
    azureRegion: settings.azureRegion?.trim().toLowerCase() ?? '',
  };
}

export function hasTranslatorSettings(
  settings: Partial<TranslatorSettings> | undefined,
): settings is TranslatorSettings {
  return Boolean(settings?.azureKey?.trim() && settings.azureRegion?.trim());
}
