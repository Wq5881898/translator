import type { ContentReadyMessage } from '../src/core/messages';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const message: ContentReadyMessage = {
      type: 'CONTENT_READY',
      payload: {
        title: document.title,
        url: window.location.href,
      },
    };

    void browser.runtime.sendMessage(message).catch(() => {
      // The background worker may restart while a page is loading.
    });
  },
});
