import { useEffect, useRef, useState } from 'react';

import {
  isExtensionMessage,
  type ExtensionResponse,
  type GetLatestTranslationMessage,
  type SelectionTranslation,
} from '../../src/core/messages';
import {
  hasTranslatorSettings,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from '../../src/core/settings';
import { createAzureTranslationProvider } from '../../src/providers/azure-translation-provider';
import { chromeTranslationProvider } from '../../src/providers/chrome-translation-provider';
import type { TranslationResult } from '../../src/providers/translation-provider';

function selectionFromResponse(response: ExtensionResponse): SelectionTranslation | null {
  if (!response.ok || !('data' in response) || response.data === null) {
    return null;
  }

  return 'selection' in response.data ? response.data : null;
}

async function translateWithOptionalFallback(text: string): Promise<TranslationResult> {
  const request = {
    text,
    sourceLanguage: 'en' as const,
    targetLanguage: 'zh-CN' as const,
  };

  try {
    return await chromeTranslationProvider.translate(request);
  } catch (localError) {
    const stored = await browser.storage.local.get(TRANSLATOR_SETTINGS_KEY);
    const settings = stored[TRANSLATOR_SETTINGS_KEY] as TranslatorSettings | undefined;

    if (settings?.azureFallbackEnabled && hasTranslatorSettings(settings)) {
      return createAzureTranslationProvider(settings).translate(request);
    }

    throw localError instanceof Error
      ? localError
      : new Error('Chrome local translation failed.');
  }
}

export function App() {
  const [latest, setLatest] = useState<SelectionTranslation | null>(null);
  const [status, setStatus] = useState('Select English text on a webpage');
  const [foundationResult, setFoundationResult] = useState<string>();
  const [outputIsError, setOutputIsError] = useState(false);
  const requestId = useRef(0);

  async function performTranslation(selectionState: SelectionTranslation) {
    const currentRequest = ++requestId.current;
    const pending = {
      ...selectionState,
      translation: null,
      error: null,
    };

    setFoundationResult(undefined);
    setOutputIsError(false);
    setLatest(pending);
    setStatus('Preparing local translation…');

    try {
      const translation = await translateWithOptionalFallback(selectionState.selection.text);

      if (currentRequest !== requestId.current) {
        return;
      }

      setLatest({ ...pending, translation });
      setStatus(
        translation.provider === 'azure'
          ? 'Translation ready (Azure fallback)'
          : 'Translation ready locally',
      );
    } catch (error) {
      if (currentRequest !== requestId.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Chrome local translation failed.';
      setLatest({ ...pending, error: message });
      setStatus(message);
      setFoundationResult(`Translation error: ${message}`);
      setOutputIsError(true);
    }
  }

  useEffect(() => {
    let active = true;
    const applySelection = (selection: SelectionTranslation) => {
      if (!active) {
        return;
      }

      if (selection.translation) {
        setFoundationResult(undefined);
        setOutputIsError(false);
        setLatest(selection);
        setStatus('Translation ready');
        return;
      }

      void performTranslation(selection);
    };
    const request: GetLatestTranslationMessage = {
      type: 'GET_LATEST_TRANSLATION',
    };

    void browser.runtime.sendMessage(request).then((response: ExtensionResponse) => {
      const selection = selectionFromResponse(response);
      if (selection) {
        applySelection(selection);
      }
    });

    const onMessage = (message: unknown) => {
      if (
        isExtensionMessage(message) &&
        message.type === 'TRANSLATION_UPDATED'
      ) {
        applySelection(message.payload);
      }
    };

    browser.runtime.onMessage.addListener(onMessage);

    return () => {
      active = false;
      requestId.current += 1;
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  async function runFoundationCheck() {
    setStatus('Checking local translation…');
    setFoundationResult(undefined);
    setOutputIsError(false);

    try {
      await chromeTranslationProvider.translate({
        text: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      });
      setStatus('Local translation is working');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Local translation check failed';
      setStatus(message);
      setFoundationResult(`Local translation check failed: ${message}`);
      setOutputIsError(true);
    }
  }

  return (
    <main className="panel">
      <p className="eyebrow">Milestone 2B</p>
      <h1>Translator</h1>
      <p className="intro">
        English is translated locally by Chrome. Azure is used only when you explicitly
        configure it as a fallback.
      </p>

      <section className="card status-card" aria-live="polite">
        <span className="label">Status</span>
        <strong className={latest?.error ? 'error' : undefined}>{status}</strong>
        {latest && !latest.translation ? (
          <button
            className="link-button"
            type="button"
            onClick={() => void performTranslation(latest)}
          >
            Translate / retry
          </button>
        ) : null}
        {latest?.error ? (
          <button
            className="link-button"
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            Optional fallback settings
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
              <dd>
                {latest.translation.provider === 'chrome-local'
                  ? 'Chrome local'
                  : 'Azure fallback'}
              </dd>
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
              ? 'Click Translate / retry. Chrome may need that click to download the language pack.'
              : 'Highlight a word, sentence, or paragraph on a normal webpage.'}
          </span>
        </section>
      )}

      <button className="secondary" type="button" onClick={runFoundationCheck}>
        Run local translation check
      </button>
      {foundationResult ? (
        <output className={outputIsError ? 'error' : undefined} aria-live="polite">
          {foundationResult}
        </output>
      ) : null}
    </main>
  );
}
