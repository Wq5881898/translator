import { describe, expect, it } from 'vitest';

import { hasTranslatorSettings, normalizeSettings } from './settings';

describe('translator settings', () => {
  it('normalizes the key and Azure region', () => {
    expect(
      normalizeSettings({ azureKey: ' secret ', azureRegion: ' WestUS2 ' }),
    ).toEqual({ azureKey: 'secret', azureRegion: 'westus2' });
  });

  it('requires both a key and region', () => {
    expect(hasTranslatorSettings({ azureKey: 'key', azureRegion: '' })).toBe(false);
    expect(hasTranslatorSettings({ azureKey: 'key', azureRegion: 'westus2' })).toBe(true);
  });
});
