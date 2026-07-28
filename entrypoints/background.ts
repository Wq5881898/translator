import {
  isExtensionMessage,
  type CaptureSelectionMessage,
  type ExtensionResponse,
  type SelectionTranslation,
  type TranslationUpdatedMessage,
} from '../src/core/messages';
import {
  hasTranslatorSettings,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from '../src/core/settings';
import { normalizeSelection } from '../src/core/selection';
import { createAzureTranslationProvider } from '../src/providers/azure-translation-provider';
import { mockTranslationProvider } from '../src/providers/mock-translation-provider';

const LATEST_TRANSLATION_KEY = 'latestSelectionTranslation';

async function publishState(state: SelectionTranslation): Promise<void> {
  await browser.storage.session.set({
    [LATEST_TRANSLATION_KEY]: state,
  });

  const update: TranslationUpdatedMessage = {
    type: 'TRANSLATION_UPDATED',
    payload: state,
  };
  await browser.runtime.sendMessage(update);
}

async function translateSelection(
  message: CaptureSelectionMessage,
): Promise<SelectionTranslation> {
  const text = normalizeSelection(message.payload.text);
  const selection = {
    ...message.payload,
    text,
  };

  if (!text) {
    const state = {
      selection,
      translation: null,
      error: 'Select some English text first.',
    };
    await publishState(state);
    return state;
  }

  try {
    const stored = await browser.storage.local.get(TRANSLATOR_SETTINGS_KEY);
    const settings = stored[TRANSLATOR_SETTINGS_KEY] as TranslatorSettings | undefined;

    if (!hasTranslatorSettings(settings)) {
      throw new Error('Configure Azure Translator in settings first.');
    }

    const translation = await createAzureTranslationProvider(settings).translate({
      text,
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });
    const state = { selection, translation, error: null };
    await publishState(state);
    return state;
  } catch (error) {
    const state = {
      selection,
      translation: null,
      error: error instanceof Error ? error.message : 'Translation failed.',
    };
    await publishState(state);
    return state;
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'translator-open-side-panel',
      title: 'Translate selection',
      contexts: ['selection'],
    });

    void browser.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'translator-open-side-panel') {
      return;
    }

    const text = normalizeSelection(info.selectionText ?? '');

    if (text) {
      void translateSelection({
        type: 'CAPTURE_SELECTION',
        payload: {
          text,
          pageTitle: tab?.title ?? '',
          pageUrl: tab?.url ?? '',
          capturedAt: new Date().toISOString(),
        },
      });
    }

    if (tab?.windowId !== undefined) {
      void browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  browser.runtime.onMessage.addListener(
    async (message: unknown): Promise<ExtensionResponse> => {
      if (!isExtensionMessage(message)) {
        return { ok: false, error: 'Unsupported message.' };
      }

      if (message.type === 'TRANSLATION_UPDATED') {
        return { ok: true };
      }

      if (message.type === 'GET_LATEST_TRANSLATION') {
        const stored = await browser.storage.session.get(LATEST_TRANSLATION_KEY);
        const data = stored[LATEST_TRANSLATION_KEY] as SelectionTranslation | undefined;
        return { ok: true, data: data ?? null };
      }

      if (message.type === 'CAPTURE_SELECTION') {
        return { ok: true, data: await translateSelection(message) };
      }

      try {
        const data = await mockTranslationProvider.translate(message.payload);
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Translation failed.',
        };
      }
    },
  );
});
