import type { PhaseName } from './breathing/types';

// 触覚フィードバック(ネイティブ Vibration API)。
// Android など navigator.vibrate を持つ環境でのみ動く。iOS Safari は vibrate を
// 持たないため、この機能は自然に無効化される。
// ネイティブ API は強弱(intensity)を持てない(ミリ秒のオン/オフの並びのみ)ので、
// 「すって/はいて/とめて」の違いは長さと回数で伝える。

/** フェーズごとの振動パターン(ミリ秒。配列は 振動/休止/振動 … の交互) */
export const PHASE_VIBRATION: Partial<Record<PhaseName, number | number[]>> = {
  inhale: 60, // すって: 長めの 1 回
  holdIn: 25, // とめて: 短く軽く
  exhale: [50, 90, 50], // はいて: 2 回
  holdOut: 25 // とめて: 短く軽く
};

/** 開始/停止の合図 */
export const TAP_VIBRATION = 30;

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // 非対応・拒否時は何もしない
  }
}
