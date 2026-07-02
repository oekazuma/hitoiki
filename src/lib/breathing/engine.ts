import { PHASE_ORDER, type BreathingPattern, type EngineState } from './types';

const IDLE_STATE: EngineState = Object.freeze({
  running: false,
  phase: 'inhale',
  phaseProgress: 0,
  remainingSeconds: 0
});

/**
 * 呼吸フェーズの進行を管理するステートマシン。UIに依存しない。
 * 時刻は外部(rAF)から渡されるため、テストでは任意のタイムスタンプで駆動できる。
 */
export class BreathingEngine {
  #pattern: BreathingPattern | null = null;
  #nextPattern: BreathingPattern | null = null;
  #phaseIndex = 0;
  #phaseStart = 0; // 現在フェーズの開始時刻(ミリ秒)
  #state: EngineState = IDLE_STATE;
  #subscribers = new Set<(s: EngineState) => void>();

  get state(): EngineState {
    return this.#state;
  }

  subscribe(fn: (s: EngineState) => void): () => void {
    this.#subscribers.add(fn);
    fn(this.#state);
    return () => this.#subscribers.delete(fn);
  }

  start(pattern: BreathingPattern, now: number): void {
    const first = PHASE_ORDER.findIndex((p) => pattern[p] > 0);
    if (first === -1) return; // 全フェーズ0秒では開始しない
    this.#pattern = { ...pattern };
    this.#nextPattern = null;
    this.#phaseIndex = first;
    this.#phaseStart = now;
    const duration = pattern[PHASE_ORDER[first]];
    this.#setState({
      running: true,
      phase: PHASE_ORDER[first],
      phaseProgress: 0,
      remainingSeconds: Math.ceil(duration)
    });
  }

  stop(): void {
    this.#pattern = null;
    this.#nextPattern = null;
    this.#setState(IDLE_STATE);
  }

  /** 実行中は次サイクルの頭から反映。停止中は次の start まで保持しない(start が pattern を受け取るため何もしない) */
  setPattern(pattern: BreathingPattern): void {
    if (this.#state.running) {
      this.#nextPattern = { ...pattern };
    }
  }

  tick(now: number): EngineState {
    if (!this.#state.running || !this.#pattern) return this.#state;

    let elapsed = (now - this.#phaseStart) / 1000;
    let duration = this.#pattern[PHASE_ORDER[this.#phaseIndex]];

    while (elapsed >= duration) {
      elapsed -= duration;
      this.#phaseStart += duration * 1000;
      if (!this.#advancePhase()) {
        this.stop();
        return this.#state;
      }
      duration = this.#pattern[PHASE_ORDER[this.#phaseIndex]];
    }

    this.#setState({
      running: true,
      phase: PHASE_ORDER[this.#phaseIndex],
      phaseProgress: duration > 0 ? elapsed / duration : 0,
      remainingSeconds: Math.ceil(duration - elapsed)
    });
    return this.#state;
  }

  /** 次の 0 秒でないフェーズへ進む。サイクル先頭へ折り返すとき保留中のパターンを適用する */
  #advancePhase(): boolean {
    let applied = false;
    // パターン切替直後に先頭フェーズが0秒のケースも拾えるよう2周分探索する
    for (let step = 1; step <= PHASE_ORDER.length * 2; step++) {
      const idx = (this.#phaseIndex + step) % PHASE_ORDER.length;
      if (idx === 0 && this.#nextPattern && !applied) {
        this.#pattern = this.#nextPattern;
        this.#nextPattern = null;
        applied = true;
      }
      if (this.#pattern![PHASE_ORDER[idx]] > 0) {
        this.#phaseIndex = idx;
        return true;
      }
    }
    return false;
  }

  #setState(next: EngineState): void {
    this.#state = next;
    for (const fn of this.#subscribers) fn(next);
  }
}
