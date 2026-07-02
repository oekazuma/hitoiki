export type PhaseName = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

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

export const PHASE_ORDER: readonly PhaseName[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

export const PHASE_LABELS: Record<PhaseName, string> = {
	inhale: 'すって',
	holdIn: 'とめて',
	exhale: 'はいて',
	holdOut: 'とめて'
};
