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

  return {
    synthesis: globalThis.speechSynthesis,
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
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
    const { synthesis } = dependencies();
    synthesis.cancel();
    finishCurrent?.();
    finishCurrent = undefined;
  }

  return {
    stop,
    async play(text: string, language = 'en-US') {
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

export const browserSpeechPlayer = createSpeechPlayer();
