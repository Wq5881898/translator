export const STAGE2_NATIVE_HOST = 'com.wq5881898.translator.stage2';
export const STAGE2_PROTOCOL_VERSION = '1.0';
export const STAGE2_MAX_TEXT_LENGTH = 5_000;

export type Stage2BridgeEnvelope<T = unknown> = {
  protocolVersion: typeof STAGE2_PROTOCOL_VERSION;
  messageType: string;
  requestId: string;
  sentAt: string;
  payload: T;
};

export type Stage2TranslationPayload = {
  text: string;
  sourceLanguage: 'en';
  targetLanguage: 'zh-CN';
};

export function createStage2BridgeEnvelope<T>(
  messageType: string,
  payload: T,
  requestId: string = crypto.randomUUID(),
): Stage2BridgeEnvelope<T> {
  return {
    protocolVersion: STAGE2_PROTOCOL_VERSION,
    messageType,
    requestId,
    sentAt: new Date().toISOString(),
    payload,
  };
}

export function isStage2BridgeEnvelope(value: unknown): value is Stage2BridgeEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Stage2BridgeEnvelope>;
  return (
    candidate.protocolVersion === STAGE2_PROTOCOL_VERSION &&
    typeof candidate.messageType === 'string' &&
    typeof candidate.requestId === 'string' &&
    typeof candidate.sentAt === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  );
}

export async function checkStage2NativeHost(): Promise<Stage2BridgeEnvelope> {
  const request = createStage2BridgeEnvelope('bridge.health', {});
  const response = await browser.runtime.sendNativeMessage(STAGE2_NATIVE_HOST, request);
  if (!isStage2BridgeEnvelope(response) || response.requestId !== request.requestId) {
    throw new Error('The Stage 2 native host returned an invalid response.');
  }
  return response;
}

type RuntimePort = ReturnType<typeof browser.runtime.connect>;

let offscreenPort: RuntimePort | undefined;
let offscreenPortPromise: Promise<RuntimePort> | undefined;
const pendingOffscreenResponses = new Map<
  string,
  {
    resolve: (response: Stage2BridgeEnvelope) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }
>();
let nativePort: RuntimePort | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

export function registerStage2OffscreenPort(port: RuntimePort): boolean {
  if (port.name !== 'stage2-offscreen') return false;
  offscreenPort = port;
  port.onMessage.addListener((message: unknown) => {
    if (!isStage2BridgeEnvelope(message)) return;
    const pending = pendingOffscreenResponses.get(message.requestId);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingOffscreenResponses.delete(message.requestId);
    pending.resolve(message);
  });
  port.onDisconnect.addListener(() => {
    if (offscreenPort === port) offscreenPort = undefined;
    for (const [requestId, pending] of pendingOffscreenResponses) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('The local translation page disconnected. Retry.'));
      pendingOffscreenResponses.delete(requestId);
    }
  });
  return true;
}

async function ensureOffscreenPort(): Promise<RuntimePort> {
  if (offscreenPort) return offscreenPort;
  offscreenPortPromise ??= (async () => {
    const hasDocument = await browser.offscreen.hasDocument();
    if (!hasDocument) {
      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_SCRAPING'],
        justification: 'Run Chrome local translation in an extension document.',
      });
    }

    const deadline = Date.now() + 5_000;
    while (!offscreenPort && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!offscreenPort) {
      throw new Error('The local translation page did not start. Reload the extension.');
    }
    return offscreenPort;
  })().finally(() => {
    offscreenPortPromise = undefined;
  });
  return offscreenPortPromise;
}

async function requestOffscreenTranslation(
  request: Stage2BridgeEnvelope<Stage2TranslationPayload>,
): Promise<Stage2BridgeEnvelope> {
  const port = await ensureOffscreenPort();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingOffscreenResponses.delete(request.requestId);
      reject(new Error('Chrome local translation timed out. Retry.'));
    }, 35_000);
    pendingOffscreenResponses.set(request.requestId, { resolve, reject, timeout });
    port.postMessage(request);
  });
}

async function handleNativeRequest(
  port: RuntimePort,
  message: unknown,
): Promise<void> {
  if (!isStage2BridgeEnvelope(message)) {
    port.postMessage(
      createStage2BridgeEnvelope('bridge.error', {
        code: 'invalid_message',
        message: 'The native host sent an invalid message.',
      }),
    );
    return;
  }

  if (message.messageType === 'bridge.health') {
    port.postMessage(
      createStage2BridgeEnvelope(
        'bridge.health.result',
        { available: true, extension: 'translator', protocolVersion: STAGE2_PROTOCOL_VERSION },
        message.requestId,
      ),
    );
    return;
  }

  if (message.messageType !== 'translation.request') {
    port.postMessage(
      createStage2BridgeEnvelope(
        'bridge.error',
        { code: 'unsupported_message', message: `Unsupported message: ${message.messageType}` },
        message.requestId,
      ),
    );
    return;
  }

  try {
    const response = await requestOffscreenTranslation(
      message as Stage2BridgeEnvelope<Stage2TranslationPayload>,
    );
    port.postMessage(response);
  } catch (error) {
    port.postMessage(
      createStage2BridgeEnvelope(
        'bridge.error',
        {
          code: 'translation_failed',
          message: error instanceof Error ? error.message : 'Chrome local translation failed.',
        },
        message.requestId,
      ),
    );
  }
}

export function startStage2NativeBridge(): void {
  if (nativePort) return;
  try {
    const port = browser.runtime.connectNative(STAGE2_NATIVE_HOST);
    nativePort = port;
    port.onMessage.addListener((message: unknown) => {
      void handleNativeRequest(port, message);
    });
    port.onDisconnect.addListener(() => {
      if (nativePort === port) nativePort = undefined;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(startStage2NativeBridge, 2_000);
    });
  } catch {
    reconnectTimer = setTimeout(startStage2NativeBridge, 2_000);
  }
}
