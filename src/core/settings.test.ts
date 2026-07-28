import { describe, expect, it } from 'vitest';

import { hasTranslatorSettings, normalizeSettings } from './settings';

describe('translator settings', () => {
  it('normalizes optional Azure fallback settings', () => {
    expect(
      normalizeSettings({
        azureFallbackEnabled: true,
        azureKey: ' secret ',
        azureRegion: ' WestUS2 ',
      }),
    ).toEqual({
      azureFallbackEnabled: true,
      azureKey: 'secret',
      azureRegion: 'westus2',
    });
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
        azureFallbackEnabled: true,
        azureKey: 'key',
        azureRegion: 'westus2',
      }),
    ).toBe(true);
  });
});
