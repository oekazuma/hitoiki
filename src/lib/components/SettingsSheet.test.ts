import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
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

  it('振動トグルで設定が切り替わる(iOS 含め常時表示)', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });

    const toggle = screen.getByRole('checkbox', { name: /振動/ });
    expect(settings.vibration).toBe(false);
    await user.click(toggle);
    expect(settings.vibration).toBe(true);
  });

  it('テーマを選ぶと設定が切り替わる', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });

    expect(settings.theme).toBe('auto');
    await user.click(screen.getByRole('radio', { name: 'つきあかり' }));
    expect(settings.theme).toBe('moon');
  });

  it('シートの外(バックドロップ)をタップすると閉じる', async () => {
    const settings = createSettings(null);
    const { container } = render(SettingsSheet, { open: true, settings });
    const dialog = container.querySelector('dialog') as HTMLDialogElement;

    // バックドロップのクリックは dialog 自身が target になる
    await fireEvent.click(dialog);
    await tick();
    expect(dialog.open).toBe(false);
  });

  it('シートの中身をタップしても閉じない', async () => {
    const settings = createSettings(null);
    const { container } = render(SettingsSheet, { open: true, settings });
    const dialog = container.querySelector('dialog') as HTMLDialogElement;

    await fireEvent.click(screen.getByText('せってい'));
    await tick();
    expect(dialog.open).toBe(true);
  });
});
