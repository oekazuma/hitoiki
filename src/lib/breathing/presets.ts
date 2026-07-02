import type { BreathingPattern } from './types';

export type PresetId = 'gentle' | 'four78' | 'box' | 'custom';

export interface Preset {
  id: Exclude<PresetId, 'custom'>;
  name: string;
  /** どんな呼吸か・どんなときにおすすめかの一言(効果の断定はしない) */
  description: string;
  pattern: BreathingPattern;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'gentle',
    name: 'ゆっくり',
    description: 'はく息を長めにする、いちばんやさしいリズム。迷ったらまずこれ',
    pattern: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 }
  },
  {
    id: 'four78',
    name: '4-7-8呼吸',
    description: '長く止めて、細く長くはく。寝る前や、気持ちを静めたいときに',
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 }
  },
  {
    id: 'box',
    name: 'ボックス呼吸',
    description: 'すべて同じ長さでリズムを刻む。集中したいときや、切り替えたいときに',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 }
  }
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
