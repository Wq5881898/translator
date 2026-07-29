import {
  createStage2BridgeEnvelope,
  isStage2BridgeEnvelope,
  type Stage2BridgeEnvelope,
  type Stage2TranslationPayload,
} from '../../src/core/stage2-bridge';
import { chromeTranslationProvider } from '../../src/providers/chrome-translation-provider';

const port = browser.runtime.connect({ name: 'stage2-offscreen' });

port.onMessage.addListener((message: unknown) => {
  void (async () => {
    if (!isStage2BridgeEnvelope(message) || message.messageType !== 'translation.request') {
      return;
    }

    const request = message as Stage2BridgeEnvelope<Stage2TranslationPayload>;
    try {
      const result = await chromeTranslationProvider.translate({
        text: request.payload.text,
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      });
      port.postMessage(
        createStage2BridgeEnvelope('translation.result', result, request.requestId),
      );
    } catch (error) {
      port.postMessage(
        createStage2BridgeEnvelope(
          'bridge.error',
          {
            code: 'translation_failed',
            message: error instanceof Error ? error.message : 'Chrome local translation failed.',
          },
          request.requestId,
        ),
      );
    }
  })();
});
