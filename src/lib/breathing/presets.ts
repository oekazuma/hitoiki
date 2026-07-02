import type { BreathingPattern } from './types';

export type PresetId = 'gentle' | 'four78' | 'box' | 'custom';

export interface Preset {
  id: Exclude<PresetId, 'custom'>;
  name: string;
  pattern: BreathingPattern;
}

export const PRESETS: readonly Preset[] = [
  { id: 'gentle', name: 'ゆっくり', pattern: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 } },
  { id: 'four78', name: '4-7-8呼吸', pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 } },
  { id: 'box', name: 'ボックス呼吸', pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 } }
];

export const DEFAULT_PRESET_ID: PresetId = 'gentle';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 吸う・吐くは 1〜10 秒、止めるは 0〜10 秒に丸める */
export function clampPattern(p: BreathingPattern): BreathingPattern {
  return {
    inhale: clamp(p.inhale, 1, 10),
    holdIn: clamp(p.holdIn, 0, 10),
    exhale: clamp(p.exhale, 1, 10),
    holdOut: clamp(p.holdOut, 0, 10)
  };
}
