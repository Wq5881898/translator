import { useEffect, useState } from 'react';

import {
  isExtensionMessage,
  type ExtensionResponse,
  type GetLatestTranslationMessage,
  type SelectionTranslation,
  type TranslateMockMessage,
} from '../../src/core/messages';

function selectionFromResponse(response: ExtensionResponse): SelectionTranslation | null {
  if (!response.ok || !('data' in response) || response.data === null) {
    return null;
  }

  return 'selection' in response.data ? response.data : null;
}

export function App() {
  const [latest, setLatest] = useState<SelectionTranslation | null>(null);
  const [status, setStatus] = useState('Select English text on a webpage');
  const [foundationResult, setFoundationResult] = useState<string>();

  useEffect(() => {
    let active = true;

    const request: GetLatestTranslationMessage = {
      type: 'GET_LATEST_TRANSLATION',
    };

    void browser.runtime.sendMessage(request).then((response: ExtensionResponse) => {
      if (!active) {
        return;
      }

      const selection = selectionFromResponse(response);
      if (selection) {
        setLatest(selection);
        setStatus('Selection received');
      }
    });

    const onMessage = (message: unknown) => {
      if (
        active &&
        isExtensionMessage(message) &&
        message.type === 'TRANSLATION_UPDATED'
      ) {
        setLatest(message.payload);
        setStatus('Selection received');
      }
    };

    browser.runtime.onMessage.addListener(onMessage);

    return () => {
      active = false;
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  async function runFoundationCheck() {
    setStatus('Checking…');
    setFoundationResult(undefined);

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

      if (
        !response.ok ||
        !('data' in response) ||
        response.data === null ||
        !('translatedText' in response.data)
      ) {
        throw new Error(response.ok ? 'Missing translation result.' : response.error);
      }

      setFoundationResult(response.data.translatedText);
      setStatus('Foundation is working');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Foundation check failed');
    }
  }

  return (
    <main className="panel">
      <p className="eyebrow">Milestone 2A</p>
      <h1>Translator</h1>
      <p className="intro">
        Select English text on a normal webpage. This build uses a mock translation provider.
      </p>

      <section className="card status-card" aria-live="polite">
        <span className="label">Status</span>
        <strong>{status}</strong>
      </section>

      {latest ? (
        <section className="translation" aria-live="polite">
          <div className="text-block">
            <span className="label">Selected English</span>
            <p lang="en">{latest.selection.text}</p>
          </div>
          <div className="text-block result">
            <span className="label">Mock translation</span>
            <p lang="zh-CN">{latest.translation.translatedText}</p>
          </div>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{latest.translation.textKind}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd title={latest.selection.pageUrl}>
                {latest.selection.pageTitle || 'Current webpage'}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="empty-state">
          <strong>No selection yet</strong>
          <span>Highlight a word, sentence, or paragraph to test the message flow.</span>
        </section>
      )}

      <button className="secondary" type="button" onClick={runFoundationCheck}>
        Run foundation check
      </button>
      {foundationResult ? <output lang="zh-CN">{foundationResult}</output> : null}
    </main>
  );
}
