import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BreathingCircle from './BreathingCircle.svelte';

describe('BreathingCircle', () => {
	it('停止中は「ひといき」と表示する', () => {
		render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: false });
		expect(screen.getAllByText('ひといき').length).toBeGreaterThan(0);
	});

	it('実行中はフェーズ名を表示する', () => {
		render(BreathingCircle, { phase: 'exhale', phaseProgress: 0.5, running: true });
		expect(screen.getAllByText('はいて').length).toBeGreaterThan(0);
	});

	it('実行中はフェーズ名を aria-live 領域で通知する', () => {
		render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: true });
		expect(screen.getByRole('status')).toHaveTextContent('すって');
	});

	it('停止中は aria-live 領域を空にする', () => {
		render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: false });
		expect(screen.getByRole('status')).toHaveTextContent('');
	});
});
