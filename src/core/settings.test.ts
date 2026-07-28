import { describe, expect, it } from 'vitest';

import { hasTranslatorSettings, normalizeSettings } from './settings';

describe('translator settings', () => {
  it('normalizes local pronunciation and optional Azure fallback settings', () => {
    expect(
      normalizeSettings({
        pronunciationLanguage: 'en-GB',
        azureFallbackEnabled: true,
        azureKey: ' secret ',
        azureRegion: ' WestUS2 ',
      }),
    ).toEqual({
      pronunciationLanguage: 'en-GB',
      azureFallbackEnabled: true,
      azureKey: 'secret',
      azureRegion: 'westus2',
    });
  });

  it('uses US English for missing or invalid saved preferences', () => {
    expect(normalizeSettings({}).pronunciationLanguage).toBe('en-US');
    expect(
      normalizeSettings({ pronunciationLanguage: 'invalid' as 'en-US' })
        .pronunciationLanguage,
    ).toBe('en-US');
  });

  it('requires both a key and region before Azure can be used', () => {
    expect(
      hasTranslatorSettings({
        azureFallbackEnabled: true,
        azureKey: 'key',
        azureRegion: '',
      }),
    ).toBe(false);
    expect(
      hasTranslatorSettings({
        pronunciationLanguage: 'en-US',
        azureFallbackEnabled: true,
        azureKey: 'key',
        azureRegion: 'westus2',
      }),
    ).toBe(true);
  });
});
