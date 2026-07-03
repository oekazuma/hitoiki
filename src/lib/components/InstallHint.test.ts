import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { matchingQueries } from '../../vitest-setup';
import { createSettings } from '$lib/settings.svelte';
import InstallHint from './InstallHint.svelte';

describe('InstallHint', () => {
  afterEach(() => {
    matchingQueries.clear();
  });

  it('未インストール・未既読なら案内を表示する', () => {
    const settings = createSettings(null);
    render(InstallHint, { settings });
    expect(screen.getByRole('note')).toHaveTextContent('ホーム画面に追加');
  });

  it('すでにインストール済み(standalone)なら表示しない', () => {
    matchingQueries.add('(display-mode: standalone)');
    const settings = createSettings(null);
    render(InstallHint, { settings });
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('既読なら表示しない', () => {
    const settings = createSettings(null);
    settings.dismissInstallHint();
    render(InstallHint, { settings });
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('閉じると設定に記録して消える', async () => {
    const user = userEvent.setup();
    const settings = createSettings(null);
    render(InstallHint, { settings });

    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(settings.installHintDismissed).toBe(true);
    expect(screen.queryByRole('note')).toBeNull();
  });
});
