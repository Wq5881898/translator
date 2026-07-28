import { type FormEvent, useEffect, useState } from 'react';

import {
  normalizeSettings,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from '../../src/core/settings';

const EMPTY_SETTINGS: TranslatorSettings = {
  azureFallbackEnabled: false,
  azureKey: '',
  azureRegion: '',
};

export function App() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [status, setStatus] = useState(
    'Chrome local translation is the default. Azure fallback is off.',
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
        setSettings({
          azureFallbackEnabled: saved.azureFallbackEnabled === true,
          azureKey: saved.azureKey ?? '',
          azureRegion: saved.azureRegion ?? '',
        });
        setStatus(
          saved.azureFallbackEnabled
            ? 'Optional Azure fallback configuration loaded'
            : 'Chrome local translation is active',
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
      normalized.azureFallbackEnabled
        ? 'Azure fallback saved locally'
        : 'Chrome local translation is active; Azure fallback is off',
    );
  }

  return (
    <main>
      <p className="eyebrow">Milestone 2B</p>
      <h1>Translator settings</h1>
      <p className="intro">
        Translation runs locally in Chrome by default. No account, API key, or paid service is
        required.
      </p>

      <form onSubmit={saveSettings}>
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
