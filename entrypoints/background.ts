import { isExtensionMessage, type ExtensionResponse } from '../src/core/messages';
import { mockTranslationProvider } from '../src/providers/mock-translation-provider';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'translator-open-side-panel',
      title: 'Open Translator',
      contexts: ['selection'],
    });
  });

  browser.contextMenus.onClicked.addListener((_info, tab) => {
    if (tab?.windowId !== undefined) {
      void browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  browser.runtime.onMessage.addListener(async (message: unknown): Promise<ExtensionResponse> => {
    if (!isExtensionMessage(message)) {
      return { ok: false, error: 'Unsupported message.' };
    }

    if (message.type === 'CONTENT_READY') {
      return { ok: true };
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
  });
});
