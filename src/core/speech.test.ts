import { describe, expect, it, vi } from 'vitest';

import {
  createSpeechPlayer,
  type SpeechSynthesisLike,
  type SpeechUtterance,
} from './speech';

function setup() {
  const utterances: SpeechUtterance[] = [];
  const synthesis: SpeechSynthesisLike = {
    cancel: vi.fn(),
    speak: vi.fn((utterance) => {
      utterances.push(utterance);
    }),
  };
  const player = createSpeechPlayer(synthesis, () => ({
    lang: '',
    rate: 1,
    onend: null,
    onerror: null,
  }));

  return { player, synthesis, utterances };
}

describe('speech player', () => {
  it('speaks English locally and resolves when playback ends', async () => {
    const { player, synthesis, utterances } = setup();
    const playback = player.play('hello');

    expect(synthesis.cancel).toHaveBeenCalledOnce();
    expect(synthesis.speak).toHaveBeenCalledOnce();
    expect(utterances[0]).toMatchObject({ lang: 'en-US', rate: 0.9 });

    utterances[0]?.onend?.();
    await expect(playback).resolves.toBeUndefined();
  });

  it('stops previous playback before starting another item', async () => {
    const { player, synthesis, utterances } = setup();
    const first = player.play('first');
    const second = player.play('second');

    await expect(first).resolves.toBeUndefined();
    expect(synthesis.cancel).toHaveBeenCalledTimes(2);

    utterances[1]?.onend?.();
    await expect(second).resolves.toBeUndefined();
  });

  it('returns an understandable playback error', async () => {
    const { player, utterances } = setup();
    const playback = player.play('hello');

    utterances[0]?.onerror?.({ error: 'voice-unavailable' });

    await expect(playback).rejects.toThrow(
      'Pronunciation failed: voice-unavailable.',
    );
  });
});
