import type { TranslationRequest, TranslationResult } from '../providers/translation-provider';

export type ContentReadyMessage = {
  type: 'CONTENT_READY';
  payload: {
    title: string;
    url: string;
  };
};

export type TranslateMockMessage = {
  type: 'TRANSLATE_MOCK';
  payload: TranslationRequest;
};

export type ExtensionMessage = ContentReadyMessage | TranslateMockMessage;

export type ExtensionResponse =
  | { ok: true; data: TranslationResult }
  | { ok: true }
  | { ok: false; error: string };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }

  const { type } = value as { type?: unknown };
  return type === 'CONTENT_READY' || type === 'TRANSLATE_MOCK';
}
