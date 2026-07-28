import { type FormEvent, useEffect, useState } from 'react';

import {
  normalizeSettings,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from '../../src/core/settings';

const EMPTY_SETTINGS: TranslatorSettings = {
  pronunciationLanguage: 'en-US',
  azureFallbackEnabled: false,
  azureKey: '',
  azureRegion: '',
};

export function App() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [status, setStatus] = useState(
    'US English pronunciation is active. Chrome local translation is the default.',
  );

  useEffect(() => {
    let active = true;

    void browser.storage.local.get(TRANSLATOR_SETTINGS_KEY).then((stored) => {
      if (!active) {
        return;
      }

      const saved = stored[TRANSLATOR_SETTINGS_KEY] as
        | Partial<TranslatorSettings>
        | undefined;
      if (saved) {
        const normalized = normalizeSettings(saved);
        setSettings(normalized);
        setStatus(
          `${normalized.pronunciationLanguage === 'en-GB' ? 'UK' : 'US'} English pronunciation loaded locally`,
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSettings(settings);

    if (
      normalized.azureFallbackEnabled &&
      (!normalized.azureKey || !normalized.azureRegion)
    ) {
      setStatus('Enter both the Azure key and region, or turn the fallback off');
      return;
    }

    await browser.storage.local.set({
      [TRANSLATOR_SETTINGS_KEY]: normalized,
    });
    setSettings(normalized);
    setStatus(
      `${normalized.pronunciationLanguage === 'en-GB' ? 'UK' : 'US'} English pronunciation saved locally. Closing…`,
    );
    window.setTimeout(() => window.close(), 700);
  }

  return (
    <main>
      <p className="eyebrow">Milestone 5</p>
      <h1>Translator settings</h1>
      <p className="intro">
        Pronunciation and preferences stay in this browser. Translation runs locally in Chrome by default.
      </p>

      <form onSubmit={saveSettings}>
        <label>
          English pronunciation
          <select
            value={settings.pronunciationLanguage}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                pronunciationLanguage: event.target.value as TranslatorSettings['pronunciationLanguage'],
              }))
            }
          >
            <option value="en-US">US English</option>
            <option value="en-GB">UK English</option>
          </select>
        </label>

        <label>
          <span>
            <input
              type="checkbox"
              checked={settings.azureFallbackEnabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  azureFallbackEnabled: event.target.checked,
                }))
              }
            />{' '}
            Use Azure only if local translation fails
          </span>
        </label>

        <label>
          Optional Azure Translator key
          <input
            type="password"
            value={settings.azureKey}
            disabled={!settings.azureFallbackEnabled}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) =>
              setSettings((current) => ({ ...current, azureKey: event.target.value }))
            }
          />
        </label>

        <label>
          Optional Azure region
          <input
            type="text"
            value={settings.azureRegion}
            disabled={!settings.azureFallbackEnabled}
            placeholder="for example: westus2"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) =>
              setSettings((current) => ({ ...current, azureRegion: event.target.value }))
            }
          />
        </label>

        <button type="submit">Save settings</button>
        <output aria-live="polite">{status}</output>
      </form>
    </main>
  );
}
