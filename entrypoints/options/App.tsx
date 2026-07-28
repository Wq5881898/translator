import { type FormEvent, useEffect, useState } from 'react';

import {
  normalizeSettings,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from '../../src/core/settings';

const EMPTY_SETTINGS: TranslatorSettings = {
  azureKey: '',
  azureRegion: '',
};

export function App() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [status, setStatus] = useState('Not configured');

  useEffect(() => {
    let active = true;

    void browser.storage.local.get(TRANSLATOR_SETTINGS_KEY).then((stored) => {
      if (!active) {
        return;
      }

      const saved = stored[TRANSLATOR_SETTINGS_KEY] as TranslatorSettings | undefined;
      if (saved) {
        setSettings(saved);
        setStatus('Configuration loaded');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSettings(settings);

    if (!normalized.azureKey || !normalized.azureRegion) {
      setStatus('Enter both the Azure key and region');
      return;
    }

    await browser.storage.local.set({
      [TRANSLATOR_SETTINGS_KEY]: normalized,
    });
    setSettings(normalized);
    setStatus('Saved locally');
  }

  return (
    <main>
      <p className="eyebrow">Milestone 2B</p>
      <h1>Translator settings</h1>
      <p className="intro">
        Your Azure credentials are stored only in this browser profile and are never committed to GitHub.
      </p>

      <form onSubmit={saveSettings}>
        <label>
          Azure Translator key
          <input
            type="password"
            value={settings.azureKey}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) =>
              setSettings((current) => ({ ...current, azureKey: event.target.value }))
            }
          />
        </label>

        <label>
          Azure region
          <input
            type="text"
            value={settings.azureRegion}
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
