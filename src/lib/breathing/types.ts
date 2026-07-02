export type PhaseName = 'ready' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

/** 呼吸サイクルを構成するフェーズ(ready はサイクル前のリードインのため除く) */
export type CyclePhase = Exclude<PhaseName, 'ready'>;

/** 各フェーズの長さ(秒) */
export interface BreathingPattern {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

export interface EngineState {
  running: boolean;
  phase: PhaseName;
  /** フェーズ内の経過率 0〜1 */
  phaseProgress: number;
  /** フェーズの残り秒数(切り上げ) */
  remainingSeconds: number;
}

export const PHASE_ORDER: readonly CyclePhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

export const PHASE_LABELS: Record<PhaseName, string> = {
  ready: 'そのまま',
  inhale: 'すって',
  holdIn: 'とめて',
  exhale: 'はいて',
  holdOut: 'とめて'
};
