import { chromeTranslationProvider } from '../providers/chrome-translation-provider';
import {
  createStage2BridgeEnvelope,
  isStage2BridgeEnvelope,
  STAGE2_OFFSCREEN_TRANSLATOR_PORT,
  STAGE2_VISIBLE_TRANSLATOR_PORT,
  type Stage2BridgeEnvelope,
  type Stage2TranslationPayload,
} from './stage2-bridge';

export { STAGE2_OFFSCREEN_TRANSLATOR_PORT, STAGE2_VISIBLE_TRANSLATOR_PORT };

let startedPortName: string | undefined;

export function startStage2TranslationWorker(portName: string): void {
  if (startedPortName === portName) return;
  startedPortName = portName;

  const port = browser.runtime.connect({ name: portName });
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
              message: error instanceof Error
                ? error.message
                : 'Chrome local translation failed.',
            },
            request.requestId,
          ),
        );
      }
    })();
  });
}
