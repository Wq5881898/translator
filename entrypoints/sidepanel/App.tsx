import { useState } from 'react';

import type { ExtensionResponse, TranslateMockMessage } from '../../src/core/messages';

export function App() {
  const [status, setStatus] = useState('Ready');
  const [translatedText, setTranslatedText] = useState<string>();

  async function runFoundationCheck() {
    setStatus('Checking…');
    setTranslatedText(undefined);

    const message: TranslateMockMessage = {
      type: 'TRANSLATE_MOCK',
      payload: {
        text: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      },
    };

    try {
      const response = (await browser.runtime.sendMessage(message)) as ExtensionResponse;

      if (!response.ok || !('data' in response)) {
        throw new Error(response.ok ? 'Missing translation result.' : response.error);
      }

      setTranslatedText(response.data.translatedText);
      setStatus('Foundation is working');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Foundation check failed');
    }
  }

  return (
    <main className="panel">
      <p className="eyebrow">Milestone 1</p>
      <h1>Translator</h1>
      <p className="intro">
        The extension shell is ready. Selection translation and favorites arrive in later milestones.
      </p>

      <section className="card" aria-live="polite">
        <span className="label">Status</span>
        <strong>{status}</strong>
        {translatedText ? <output lang="zh-CN">{translatedText}</output> : null}
      </section>

      <button type="button" onClick={runFoundationCheck}>
        Run foundation check
      </button>
    </main>
  );
}
