export const TRANSLATOR_SETTINGS_KEY = 'translatorSettings';

export type TranslatorSettings = {
  azureFallbackEnabled: boolean;
  azureKey: string;
  azureRegion: string;
};

export function normalizeSettings(settings: TranslatorSettings): TranslatorSettings {
  return {
    azureFallbackEnabled: settings.azureFallbackEnabled === true,
    azureKey: settings.azureKey.trim(),
    azureRegion: settings.azureRegion.trim().toLowerCase(),
  };
}

export function hasTranslatorSettings(
  settings: TranslatorSettings | undefined,
): settings is TranslatorSettings {
  return Boolean(settings?.azureKey.trim() && settings.azureRegion.trim());
}
