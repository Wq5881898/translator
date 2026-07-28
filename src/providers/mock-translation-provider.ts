import type {
  TextKind,
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
} from './translation-provider';

const SENTENCE_ENDING = /[.!?]$/u;
const WORDS_IN_SENTENCE = 12;

function classifyText(text: string): TextKind {
  const words = text.trim().split(/\s+/u);

  if (words.length === 1 && !SENTENCE_ENDING.test(text)) {
    return 'word';
  }

  return words.length <= WORDS_IN_SENTENCE ? 'sentence' : 'paragraph';
}

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
