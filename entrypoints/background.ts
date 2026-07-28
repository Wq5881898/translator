import {
  isExtensionMessage,
  type CaptureSelectionMessage,
  type ExtensionResponse,
  type SelectionTranslation,
  type TranslationUpdatedMessage,
} from '../src/core/messages';
import { normalizeSelection } from '../src/core/selection';
import { mockTranslationProvider } from '../src/providers/mock-translation-provider';

const LATEST_TRANSLATION_KEY = 'latestSelectionTranslation';

async function translateSelection(
  message: CaptureSelectionMessage,
): Promise<SelectionTranslation> {
  const text = normalizeSelection(message.payload.text);

  if (!text) {
    throw new Error('Select some English text first.');
  }

  const translation = await mockTranslationProvider.translate({
    text,
    sourceLanguage: 'en',
    targetLanguage: 'zh-CN',
  });

  const state: SelectionTranslation = {
    selection: {
      ...message.payload,
      text,
    },
    translation,
  };

  await browser.storage.session.set({
    [LATEST_TRANSLATION_KEY]: state,
  });

  const update: TranslationUpdatedMessage = {
    type: 'TRANSLATION_UPDATED',
    payload: state,
  };
  await browser.runtime.sendMessage(update);

  return state;
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

      try {
        if (message.type === 'CAPTURE_SELECTION') {
          const data = await translateSelection(message);
          return { ok: true, data };
        }

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
