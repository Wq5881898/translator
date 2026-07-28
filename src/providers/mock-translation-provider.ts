import {
  classifyText,
  type TranslationProvider,
  type TranslationRequest,
  type TranslationResult,
} from './translation-provider';

export const mockTranslationProvider: TranslationProvider = {
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const text = request.text.trim();

    if (!text) {
      throw new Error('Text is required.');
    }

    return {
      originalText: text,
      translatedText: text.toLowerCase() === 'hello' ? '你好' : `【模拟译文】${text}`,
      textKind: classifyText(text),
      provider: 'mock',
    };
  },
};
