import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHASE_ORDER } from './breathing/types';
import { canVibrate, PHASE_VIBRATION, TAP_VIBRATION, vibrate } from './haptics';

/** navigator.vibrate を一時的に差し込む(happy-dom の navigator には無い) */
function withVibrate(impl: (pattern: number | number[]) => boolean) {
  Object.defineProperty(navigator, 'vibrate', { value: impl, configurable: true, writable: true });
}

function removeVibrate() {
  if ('vibrate' in navigator) delete (navigator as { vibrate?: unknown }).vibrate;
}

afterEach(() => {
  removeVibrate();
  vi.restoreAllMocks();
});

describe('PHASE_VIBRATION', () => {
  it('サイクルの全フェーズに振動パターンがある', () => {
    for (const phase of PHASE_ORDER) {
      expect(PHASE_VIBRATION[phase]).toBeDefined();
    }
  });

  it('はいて は 2 回、それ以外は 1 回で強弱ではなく回数と長さで伝える', () => {
    expect(PHASE_VIBRATION.inhale).toBe(60);
    expect(PHASE_VIBRATION.holdIn).toBe(25);
    expect(PHASE_VIBRATION.exhale).toEqual([50, 90, 50]);
    expect(PHASE_VIBRATION.holdOut).toBe(25);
  });

  it('タップの合図が定義されている', () => {
    expect(TAP_VIBRATION).toBe(30);
  });
});

describe('canVibrate', () => {
  it('navigator.vibrate が無ければ false(iOS Safari 相当)', () => {
    removeVibrate();
    expect(canVibrate()).toBe(false);
  });

  it('navigator.vibrate があれば true(Android 相当)', () => {
    withVibrate(() => true);
    expect(canVibrate()).toBe(true);
  });

  it('navigator.vibrate が関数でなければ false(存在しても呼べない場合)', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true, writable: true });
    expect(canVibrate()).toBe(false);
  });
});

describe('vibrate', () => {
  it('対応環境では navigator.vibrate にそのままパターンを渡す', () => {
    const spy = vi.fn(() => true);
    withVibrate(spy);
    vibrate([50, 90, 50]);
    expect(spy).toHaveBeenCalledWith([50, 90, 50]);
  });

  it('非対応環境では何もしない(例外を投げない)', () => {
    removeVibrate();
    expect(() => vibrate(30)).not.toThrow();
  });

  it('navigator.vibrate が例外を投げても飲み込む', () => {
    withVibrate(() => {
      throw new Error('blocked');
    });
    expect(() => vibrate(30)).not.toThrow();
  });
});
