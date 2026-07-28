import { useEffect, useRef, useState } from 'react';

import {
  addFavorite,
  FAVORITES_STORAGE_KEY,
  findFavorite,
  removeFavorite,
  type FavoriteEntry,
} from '../../src/core/favorites';
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
import { browserSpeechPlayer } from '../../src/core/speech';
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

function formatFavoriteTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function App() {
  const [latest, setLatest] = useState<SelectionTranslation | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [status, setStatus] = useState('Select English text on a webpage');
  const [foundationResult, setFoundationResult] = useState<string>();
  const [outputIsError, setOutputIsError] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const requestId = useRef(0);
  const speechRequestId = useRef(0);

  async function performTranslation(selectionState: SelectionTranslation) {
    const currentRequest = ++requestId.current;
    const pending = {
      ...selectionState,
      translation: null,
      error: null,
    };

    speechRequestId.current += 1;
    try {
      browserSpeechPlayer.stop();
    } catch {
      // Translation remains available when speech synthesis is unsupported.
    }
    setSpeaking(false);
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

    void browser.storage.local.get(FAVORITES_STORAGE_KEY).then((stored) => {
      if (!active) {
        return;
      }

      const saved = stored[FAVORITES_STORAGE_KEY];
      if (Array.isArray(saved)) {
        setFavorites(saved as FavoriteEntry[]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

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

  async function persistFavorites(nextFavorites: FavoriteEntry[]) {
    await browser.storage.local.set({
      [FAVORITES_STORAGE_KEY]: nextFavorites,
    });
    setFavorites(nextFavorites);
  }

  async function toggleCurrentFavorite() {
    const translation = latest?.translation;
    if (!translation) {
      return;
    }

    const existing = findFavorite(favorites, translation);
    const nextFavorites = existing
      ? removeFavorite(favorites, existing.id)
      : addFavorite(favorites, translation);

    await persistFavorites(nextFavorites);
    setStatus(existing ? 'Removed from favorites' : 'Saved locally to favorites');
  }

  async function removeSavedFavorite(id: string) {
    await persistFavorites(removeFavorite(favorites, id));
    setStatus('Removed from favorites');
  }

  async function togglePronunciation(text: string) {
    if (speaking) {
      speechRequestId.current += 1;
      browserSpeechPlayer.stop();
      setSpeaking(false);
      setStatus('Pronunciation stopped');
      return;
    }

    const currentRequest = ++speechRequestId.current;
    setFoundationResult(undefined);
    setOutputIsError(false);
    setSpeaking(true);
    setStatus('Playing English pronunciation…');

    try {
      await browserSpeechPlayer.play(text);

      if (currentRequest !== speechRequestId.current) {
        return;
      }

      setSpeaking(false);
      setStatus('Pronunciation finished');
    } catch (error) {
      if (currentRequest !== speechRequestId.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Pronunciation failed.';
      setSpeaking(false);
      setStatus(message);
      setFoundationResult(message);
      setOutputIsError(true);
    }
  }

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

  const currentFavorite = latest?.translation
    ? findFavorite(favorites, latest.translation)
    : undefined;
  const wordFavorites = favorites.filter((favorite) => favorite.kind === 'word');
  const sentenceFavorites = favorites.filter(
    (favorite) => favorite.kind === 'sentence',
  );

  return (
    <main className="panel">
      <p className="eyebrow">Milestone 3</p>
      <h1>Translator</h1>
      <p className="intro">
        Translate locally, then keep useful words and sentences in this browser.
      </p>
      <button
        className="secondary favorites-trigger"
        type="button"
        onClick={() => setShowFavorites(true)}
      >
        Open favorites ({favorites.length})
      </button>

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
            <button
              className="speech-button secondary"
              type="button"
              aria-label={speaking ? 'Stop pronunciation' : 'Play English pronunciation'}
              onClick={() => void togglePronunciation(latest.selection.text)}
            >
              {speaking ? '■ Stop pronunciation' : '▶ Play pronunciation'}
            </button>
          </div>
          <div className="text-block result">
            <span className="label">Chinese translation</span>
            <p lang="zh-CN">{latest.translation.translatedText}</p>
          </div>
          <button
            className={`heart-button${currentFavorite ? ' saved' : ''}`}
            type="button"
            aria-label={currentFavorite ? 'Remove from favorites' : 'Save to favorites'}
            title={currentFavorite ? 'Saved to favorites' : 'Save to favorites'}
            onClick={() => void toggleCurrentFavorite()}
          >
            <span aria-hidden="true">{currentFavorite ? '♥' : '♡'}</span>
          </button>
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

      {showFavorites ? (
        <div className="favorites-overlay" role="dialog" aria-modal="true" aria-labelledby="favorites-heading">
          <section className="favorites">
            <div className="section-heading">
              <div>
                <h2 id="favorites-heading">Favorites</h2>
                <span>{favorites.length} saved locally</span>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Close favorites"
                onClick={() => setShowFavorites(false)}
              >
                ×
              </button>
            </div>

        <div className="favorite-group">
          <h3>Words ({wordFavorites.length})</h3>
          {wordFavorites.length ? (
            <ul>
              {wordFavorites.map((favorite) => (
                <li key={favorite.id}>
                  <div>
                    <strong lang="en">{favorite.originalText}</strong>
                    {favorite.phonetic ? (
                      <span className="phonetic">{favorite.phonetic}</span>
                    ) : null}
                    <span lang="zh-CN">{favorite.translatedText}</span>
                    <time dateTime={favorite.firstFavoritedAt}>
                      First saved {formatFavoriteTime(favorite.firstFavoritedAt)}
                    </time>
                  </div>
                  <button
                    className="remove-button"
                    type="button"
                    aria-label={`Remove ${favorite.originalText}`}
                    onClick={() => void removeSavedFavorite(favorite.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No saved words yet.</p>
          )}
        </div>

        <div className="favorite-group">
          <h3>Sentences ({sentenceFavorites.length})</h3>
          {sentenceFavorites.length ? (
            <ul>
              {sentenceFavorites.map((favorite) => (
                <li key={favorite.id}>
                  <div>
                    <strong lang="en">{favorite.originalText}</strong>
                    <span lang="zh-CN">{favorite.translatedText}</span>
                    <time dateTime={favorite.firstFavoritedAt}>
                      First saved {formatFavoriteTime(favorite.firstFavoritedAt)}
                    </time>
                  </div>
                  <button
                    className="remove-button"
                    type="button"
                    aria-label="Remove saved sentence"
                    onClick={() => void removeSavedFavorite(favorite.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No saved sentences yet.</p>
          )}
        </div>
          </section>
        </div>
      ) : null}

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
