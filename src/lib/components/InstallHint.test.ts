import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { matchingQueries } from '../../vitest-setup';
import { createSettings } from '$lib/settings.svelte';
import InstallHint from './InstallHint.svelte';

// 注: プリレンダー HTML にヒントを含めない(ちらつき防止)ことは、
// マウント後にだけ表示する mounted フラグで担保している。
// SSR 出力の検証はビルド成果物 build/index.html の grep で行う(単体テスト外)。

describe('InstallHint', () => {
  afterEach(() => {
    matchingQueries.clear();
  });

  it('未インストール・未既読ならマウント後に案内を表示する', async () => {
    const settings = createSettings(null);
    render(InstallHint, { settings });
    await tick();
    expect(screen.getByRole('note')).toHaveTextContent('ホーム画面に追加');
  });

  it('すでにインストール済み(standalone)なら表示しない', async () => {
    matchingQueries.add('(display-mode: standalone)');
    const settings = createSettings(null);
    render(InstallHint, { settings });
    await tick();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('既読なら表示しない', async () => {
    const settings = createSettings(null);
    settings.dismissInstallHint();
    render(InstallHint, { settings });
    await tick();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('閉じると設定に記録して消える', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(InstallHint, { settings });
    await tick();

    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(settings.installHintDismissed).toBe(true);
    expect(screen.queryByRole('note')).toBeNull();
  });
});
