import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createSettings } from '$lib/settings.svelte';
import SettingsSheet from './SettingsSheet.svelte';

describe('SettingsSheet', () => {
	it('プリセットを選ぶと設定が切り替わる', async () => {
		const user = userEvent.setup();
		const settings = createSettings(null);
		render(SettingsSheet, { open: true, settings });

		await user.click(screen.getByRole('radio', { name: 'ボックス呼吸' }));
		expect(settings.presetId).toBe('box');
		expect(settings.custom.holdIn).toBe(4);
	});

	it('スライダーを動かすとカスタム扱いになる', async () => {
		const settings = createSettings(null);
		render(SettingsSheet, { open: true, settings });

		const slider = screen.getByRole('slider', { name: /すう/ });
		await fireEvent.input(slider, { target: { value: '8' } });
		expect(settings.custom.inhale).toBe(8);
		expect(settings.presetId).toBe('custom');
	});

	it('振動非対応の環境では振動トグルを表示しない', () => {
		const settings = createSettings(null);
		render(SettingsSheet, { open: true, settings });
		// jsdom の navigator に vibrate は無い
		expect(screen.queryByRole('checkbox', { name: /振動/ })).toBeNull();
	});
});
