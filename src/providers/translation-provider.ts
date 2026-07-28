export type TextKind = 'word' | 'sentence' | 'paragraph';

export type TranslationRequest = {
  text: string;
  sourceLanguage: 'en';
  targetLanguage: 'zh-CN';
};

export type TranslationResult = {
  originalText: string;
  translatedText: string;
  textKind: TextKind;
  provider: string;
};

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<TranslationResult>;
}
