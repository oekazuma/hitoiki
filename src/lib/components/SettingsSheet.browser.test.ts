import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createSettings } from '$lib/settings.svelte';
import SettingsSheet from './SettingsSheet.svelte';

// <dialog> の挙動は実ブラウザが最も忠実(happy-dom では showModal / Esc をポリフィルするだけ)。
// そのためダイアログ関連だけ browser project(Chromium)で検証する。
const dialogEl = () => document.querySelector('dialog') as HTMLDialogElement;

describe('SettingsSheet(dialog / browser)', () => {
  it('open=true でモーダルとして開く', async () => {
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });
    await expect.poll(() => dialogEl()?.open).toBe(true);
  });

  it('Esc で閉じる(ブラウザネイティブの取り消し)', async () => {
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });
    await expect.poll(() => dialogEl()?.open).toBe(true);

    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialogEl()?.open).toBe(false);
  });

  it('シートの外(バックドロップ)をタップすると閉じる', async () => {
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });
    await expect.poll(() => dialogEl()?.open).toBe(true);

    // バックドロップのクリックは dialog 自身が target になる
    dialogEl().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect.poll(() => dialogEl()?.open).toBe(false);
  });

  it('シートの中身をタップしても閉じない', async () => {
    const settings = createSettings(null);
    render(SettingsSheet, { open: true, settings });
    await expect.poll(() => dialogEl()?.open).toBe(true);

    await page.getByRole('heading', { name: 'せってい' }).click();
    expect(dialogEl().open).toBe(true);
  });
});
