import {
  DEFAULT_PRONUNCIATION_LANGUAGE,
  isPronunciationLanguage,
  TRANSLATOR_SETTINGS_KEY,
  type TranslatorSettings,
} from './settings';

export type SpeechUtterance = {
  lang: string;
  rate: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

export type SpeechSynthesisLike = {
  cancel(): void;
  speak(utterance: SpeechUtterance): void;
};

export type SpeechPlayer = {
  play(text: string, language?: string): Promise<void>;
  stop(): void;
};

function browserDependencies(): {
  synthesis: SpeechSynthesisLike;
  createUtterance: (text: string) => SpeechUtterance;
} {
  if (
    !globalThis.speechSynthesis ||
    typeof globalThis.SpeechSynthesisUtterance === 'undefined'
  ) {
    throw new Error('Pronunciation is unavailable in this browser.');
  }

  const nativeSynthesis = globalThis.speechSynthesis;

  return {
    synthesis: {
      cancel: () => nativeSynthesis.cancel(),
      speak: (utterance) =>
        nativeSynthesis.speak(utterance as unknown as SpeechSynthesisUtterance),
    },
    createUtterance: (text) =>
      new SpeechSynthesisUtterance(text) as unknown as SpeechUtterance,
  };
}

export function createSpeechPlayer(
  suppliedSynthesis?: SpeechSynthesisLike,
  suppliedUtteranceFactory?: (text: string) => SpeechUtterance,
): SpeechPlayer {
  let finishCurrent: (() => void) | undefined;

  function dependencies() {
    if (suppliedSynthesis && suppliedUtteranceFactory) {
      return {
        synthesis: suppliedSynthesis,
        createUtterance: suppliedUtteranceFactory,
      };
    }

    return browserDependencies();
  }

  function stop() {
    try {
      const { synthesis } = dependencies();
      synthesis.cancel();
    } catch {
      // Stopping is safe even when speech synthesis is unavailable.
    }
    finishCurrent?.();
    finishCurrent = undefined;
  }

  return {
    stop,
    async play(text: string, language = DEFAULT_PRONUNCIATION_LANGUAGE) {
      const normalized = text.replace(/\s+/gu, ' ').trim();
      if (!normalized) {
        throw new Error('There is no English text to pronounce.');
      }

      const { synthesis, createUtterance } = dependencies();
      synthesis.cancel();
      finishCurrent?.();

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const utterance = createUtterance(normalized);
        utterance.lang = language;
        utterance.rate = 0.9;

        const finish = () => {
          if (settled) {
            return;
          }
          settled = true;
          finishCurrent = undefined;
          resolve();
        };

        finishCurrent = finish;
        utterance.onend = finish;
        utterance.onerror = (event) => {
          if (settled) {
            return;
          }
          settled = true;
          finishCurrent = undefined;
          reject(
            new Error(
              event.error
                ? `Pronunciation failed: ${event.error}.`
                : 'Pronunciation failed.',
            ),
          );
        };

        synthesis.speak(utterance);
      });
    },
  };
}

const localSpeechPlayer = createSpeechPlayer();

export const browserSpeechPlayer: SpeechPlayer = {
  stop: () => localSpeechPlayer.stop(),
  async play(text, language) {
    let preferredLanguage = language;

    if (!preferredLanguage) {
      try {
        const stored = await browser.storage.local.get(TRANSLATOR_SETTINGS_KEY);
        const settings = stored[TRANSLATOR_SETTINGS_KEY] as
          | Partial<TranslatorSettings>
          | undefined;
        preferredLanguage = isPronunciationLanguage(settings?.pronunciationLanguage)
          ? settings.pronunciationLanguage
          : DEFAULT_PRONUNCIATION_LANGUAGE;
      } catch {
        preferredLanguage = DEFAULT_PRONUNCIATION_LANGUAGE;
      }
    }

    return localSpeechPlayer.play(text, preferredLanguage);
  },
};
