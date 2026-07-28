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
    const applySelection = (selection: SelectionTranslation) => {
      setLatest(selection);
      setStatus(selection.error ?? 'Translation ready');
    };
    const request: GetLatestTranslationMessage = {
      type: 'GET_LATEST_TRANSLATION',
    };

    void browser.runtime.sendMessage(request).then((response: ExtensionResponse) => {
      if (!active) {
        return;
      }

      const selection = selectionFromResponse(response);
      if (selection) {
        applySelection(selection);
      }
    });

    const onMessage = (message: unknown) => {
      if (
        active &&
        isExtensionMessage(message) &&
        message.type === 'TRANSLATION_UPDATED'
      ) {
        applySelection(message.payload);
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
      <p className="eyebrow">Milestone 2B</p>
      <h1>Translator</h1>
      <p className="intro">
        Select English text to translate it into Simplified Chinese with Azure.
      </p>

      <section className="card status-card" aria-live="polite">
        <span className="label">Status</span>
        <strong className={latest?.error ? 'error' : undefined}>{status}</strong>
        {latest?.error ? (
          <button
            className="link-button"
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            Open settings
          </button>
        ) : null}
      </section>

      {latest?.translation ? (
        <section className="translation" aria-live="polite">
          <div className="text-block">
            <span className="label">Selected English</span>
            <p lang="en">{latest.selection.text}</p>
            {latest.translation.phonetic ? (
              <p className="phonetic">{latest.translation.phonetic}</p>
            ) : null}
          </div>
          <div className="text-block result">
            <span className="label">Chinese translation</span>
            <p lang="zh-CN">{latest.translation.translatedText}</p>
          </div>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{latest.translation.textKind}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{latest.translation.provider}</dd>
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
          <strong>{latest?.error ? 'Translation unavailable' : 'No selection yet'}</strong>
          <span>
            {latest?.error
              ? 'Check the local Azure configuration and select the text again.'
              : 'Highlight a word, sentence, or paragraph on a normal webpage.'}
          </span>
        </section>
      )}

      <button className="secondary" type="button" onClick={runFoundationCheck}>
        Run foundation check
      </button>
      {foundationResult ? <output lang="zh-CN">{foundationResult}</output> : null}
    </main>
  );
}
