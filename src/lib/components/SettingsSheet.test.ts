import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { PRESETS } from '$lib/breathing/presets';
import { createSettings } from '$lib/settings.svelte';
import SettingsSheet from './SettingsSheet.svelte';

describe('SettingsSheet', () => {
  afterEach(() => {
    // 振動対応をスタブしたテストの後始末(他テストへ漏らさない)
    if ('vibrate' in navigator) delete (navigator as { vibrate?: unknown }).vibrate;
  });

  it('プリセットを選ぶと設定が切り替わる', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });

    await user.click(screen.getByRole('radio', { name: 'ボックス呼吸' }));
    expect(settings.presetId).toBe('box');
    expect(settings.custom.holdIn).toBe(4);
  });

  it('各プリセットに説明文が表示される', () => {
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });

    for (const preset of PRESETS) {
      expect(screen.getByText(preset.description)).toBeInTheDocument();
    }
  });

  it('秒数の調整はデフォルトで折りたたまれ、パターンのすぐ下にある', () => {
    const settings = createSettings(null);
    const { container } = render(SettingsSheet, { open: true, settings });

    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);

    // スライダーは折りたたみの中にある
    const slider = screen.getByRole('slider', { name: /すう/ });
    expect(details?.contains(slider)).toBe(true);

    // 並び順: 呼吸のパターン → 秒数の調整(折りたたみ)
    const presetGroup = screen.getByText('呼吸のパターン').closest('fieldset');
    expect(presetGroup).not.toBeNull();
    const position = presetGroup!.compareDocumentPosition(details!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    // happy-dom の navigator に vibrate は無い(iOS Safari 相当)
    expect(screen.queryByRole('checkbox', { name: /振動/ })).toBeNull();
  });

  it('振動対応の環境ではマウント後に振動トグルを表示する', async () => {
    // 表示判定はマウント後の effect で行う(プリレンダー HTML との hydration 不一致を避けるため)。
    // テスト環境は effect を同期フラッシュするので tick 前後の差は再現できないが、
    // 対応環境でトグルが出ること自体の回帰ガードとして残す。
    Object.defineProperty(navigator, 'vibrate', { value: () => true, configurable: true, writable: true });
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });
    await tick();
    expect(screen.queryByRole('checkbox', { name: /振動/ })).not.toBeNull();
  });

  it('テーマを選ぶと設定が切り替わる', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });

    expect(settings.theme).toBe('auto');
    await user.click(screen.getByRole('radio', { name: 'つきあかり' }));
    expect(settings.theme).toBe('moon');
  });

  // <dialog> の開閉挙動(showModal / Esc / バックドロップ)は実ブラウザが忠実なため、
  // SettingsSheet.browser.test.ts(browser project)で検証する。
});
