import { describe, expect, it } from 'vitest';
import { PHASE_LABELS, PHASE_ORDER } from './types';
import { clampPattern, DEFAULT_PRESET_ID, PRESETS } from './presets';

describe('presets', () => {
  it('デフォルトプリセットは「ゆっくり」(息止めなし)', () => {
    const gentle = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    expect(gentle?.pattern).toEqual({ inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 });
  });

  it('4-7-8呼吸とボックス呼吸を含む', () => {
    expect(PRESETS.find((p) => p.id === 'four78')?.pattern).toEqual({
      inhale: 4,
      holdIn: 7,
      exhale: 8,
      holdOut: 0
    });
    expect(PRESETS.find((p) => p.id === 'box')?.pattern).toEqual({
      inhale: 4,
      holdIn: 4,
      exhale: 4,
      holdOut: 4
    });
  });

  it('フェーズ表記はひらがな', () => {
    expect(PHASE_LABELS.inhale).toBe('すって');
    expect(PHASE_LABELS.holdIn).toBe('とめて');
    expect(PHASE_LABELS.exhale).toBe('はいて');
    expect(PHASE_LABELS.holdOut).toBe('とめて');
  });

  it('フェーズ順は 吸う→止める→吐く→止める', () => {
    expect(PHASE_ORDER).toEqual(['inhale', 'holdIn', 'exhale', 'holdOut']);
  });
});

describe('clampPattern', () => {
  it('吸う・吐くは 1〜10 秒に丸める', () => {
    const clamped = clampPattern({ inhale: 0, holdIn: 4, exhale: 99, holdOut: 4 });
    expect(clamped.inhale).toBe(1);
    expect(clamped.exhale).toBe(10);
  });

  it('止めるは 0〜10 秒に丸める', () => {
    const clamped = clampPattern({ inhale: 4, holdIn: -3, exhale: 6, holdOut: 42 });
    expect(clamped.holdIn).toBe(0);
    expect(clamped.holdOut).toBe(10);
  });

  it('範囲内の値はそのまま', () => {
    const pattern = { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 };
    expect(clampPattern(pattern)).toEqual(pattern);
  });
});
