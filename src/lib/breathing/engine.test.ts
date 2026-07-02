import { describe, expect, it } from 'vitest';
import { BreathingEngine } from './engine';

const BOX = { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };
const GENTLE = { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 };

describe('BreathingEngine', () => {
	it('start で最初のフェーズ(吸う)から始まる', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		expect(e.state.running).toBe(true);
		expect(e.state.phase).toBe('inhale');
		expect(e.state.phaseProgress).toBe(0);
		expect(e.state.remainingSeconds).toBe(4);
	});

	it('tick でフェーズ内の経過率が進む', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		const s = e.tick(2000);
		expect(s.phase).toBe('inhale');
		expect(s.phaseProgress).toBeCloseTo(0.5);
		expect(s.remainingSeconds).toBe(2);
	});

	it('フェーズ時間を超えると次のフェーズへ進む', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		const s = e.tick(4000);
		expect(s.phase).toBe('holdIn');
		expect(s.phaseProgress).toBeCloseTo(0);
	});

	it('0秒のフェーズはスキップされる', () => {
		const e = new BreathingEngine();
		e.start(GENTLE, 0);
		const s = e.tick(4000);
		expect(s.phase).toBe('exhale');
	});

	it('サイクル末尾から先頭へ戻る', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		const s = e.tick(16000);
		expect(s.phase).toBe('inhale');
		expect(s.phaseProgress).toBeCloseTo(0);
	});

	it('複数フェーズをまたぐ大きな時間経過も正しく処理する(タブのバックグラウンド化)', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		const s = e.tick(9000);
		expect(s.phase).toBe('exhale');
		expect(s.phaseProgress).toBeCloseTo(0.25);
	});

	it('実行中の setPattern は次サイクルの頭から反映される', () => {
		const e = new BreathingEngine();
		e.start(GENTLE, 0); // 1サイクル = 4 + 6 = 10 秒
		e.setPattern(BOX);
		expect(e.tick(5000).phase).toBe('exhale'); // まだ GENTLE のまま
		expect(e.tick(10000).phase).toBe('inhale'); // 折返しで BOX に切替
		expect(e.tick(14000).phase).toBe('holdIn'); // BOX にしかない holdIn に入る
	});

	it('停止中の setPattern は無視され、start に渡したパターンが使われる', () => {
		const e = new BreathingEngine();
		e.setPattern(GENTLE); // 停止中なので無視される
		e.start(BOX, 0);
		expect(e.tick(4000).phase).toBe('holdIn'); // BOX の holdIn に入る
	});

	it('stop で初期状態に戻る', () => {
		const e = new BreathingEngine();
		e.start(BOX, 0);
		e.tick(5000);
		e.stop();
		expect(e.state).toEqual({
			running: false,
			phase: 'inhale',
			phaseProgress: 0,
			remainingSeconds: 0
		});
	});

	it('全フェーズ0秒のパターンでは開始しない', () => {
		const e = new BreathingEngine();
		e.start({ inhale: 0, holdIn: 0, exhale: 0, holdOut: 0 }, 0);
		expect(e.state.running).toBe(false);
	});

	it('停止中の tick は状態を変えない', () => {
		const e = new BreathingEngine();
		const before = e.state;
		expect(e.tick(1000)).toBe(before);
	});

	it('subscribe は即時に現在値を通知し、更新のたびに呼ばれる', () => {
		const e = new BreathingEngine();
		const seen: string[] = [];
		const unsubscribe = e.subscribe((s) => seen.push(`${s.running}:${s.phase}`));
		expect(seen).toEqual(['false:inhale']);
		e.start(BOX, 0);
		e.tick(4000);
		expect(seen).toEqual(['false:inhale', 'true:inhale', 'true:holdIn']);
		unsubscribe();
		e.tick(8000);
		expect(seen.length).toBe(3);
	});
});
