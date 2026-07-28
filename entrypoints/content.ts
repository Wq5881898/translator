import type { CaptureSelectionMessage } from '../src/core/messages';
import { normalizeSelection } from '../src/core/selection';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    let previousSelection = '';

    function sendCurrentSelection() {
      const text = normalizeSelection(window.getSelection()?.toString() ?? '');

      if (!text || text === previousSelection) {
        return;
      }

      previousSelection = text;

      const message: CaptureSelectionMessage = {
        type: 'CAPTURE_SELECTION',
        payload: {
          text,
          pageTitle: document.title,
          pageUrl: window.location.href,
          capturedAt: new Date().toISOString(),
        },
      };

      void browser.runtime.sendMessage(message).catch(() => {
        // Navigation can disconnect the content script while the message is sent.
      });
    }

    document.addEventListener('mouseup', sendCurrentSelection);
    document.addEventListener('keyup', (event) => {
      if (event.shiftKey) {
        sendCurrentSelection();
      }
    });
  },
});
