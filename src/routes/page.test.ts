import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

describe('メイン画面', () => {
	it('はじめるボタンで開始し、とめるボタンで停止する', async () => {
		const user = userEvent.setup();
		render(Page);

		await user.click(screen.getByRole('button', { name: 'はじめる' }));
		expect(screen.getByRole('button', { name: 'とめる' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('すって');

		await user.click(screen.getByRole('button', { name: 'とめる' }));
		expect(screen.getByRole('button', { name: 'はじめる' })).toBeInTheDocument();
	});

	it('rAF ループでフェーズが進行する(4.1秒後に「はいて」)', async () => {
		// rAF のコールバックを捕捉し、テスト側から任意のタイムスタンプで手動駆動する
		const frames: FrameRequestCallback[] = [];
		const rafSpy = vi
			.spyOn(globalThis, 'requestAnimationFrame')
			.mockImplementation((cb: FrameRequestCallback) => {
				frames.push(cb);
				return frames.length;
			});
		const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

		try {
			const user = userEvent.setup();
			render(Page);

			await user.click(screen.getByRole('button', { name: 'はじめる' }));
			// engine.start はクリック時の実時刻で走るため、基準時刻はクリック直後に取る
			const base = performance.now();
			expect(screen.getByRole('status')).toHaveTextContent('すって');
			expect(frames.length).toBeGreaterThan(0);

			// デフォルト「ゆっくり」= 吸う4秒 → 吐く6秒。4.1秒後は「はいて」のはず
			// (クリックからの数msのドリフトは 4000〜10000ms の吐くフェーズ窓に収まる)
			frames[frames.length - 1](base + 4100);
			await tick();
			expect(screen.getByRole('status')).toHaveTextContent('はいて');

			await user.click(screen.getByRole('button', { name: 'とめる' }));
			expect(screen.getByRole('button', { name: 'はじめる' })).toBeInTheDocument();
			expect(screen.getByRole('status')).toBeEmptyDOMElement();
		} finally {
			rafSpy.mockRestore();
			cafSpy.mockRestore();
		}
	});
});
