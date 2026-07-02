import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

describe('メイン画面', () => {
  it('画面のどこをタップしても開始・停止できる', async () => {
    const user = userEvent.setup();
    render(Page);

    // 全画面のタップ領域がボタンとして公開されている
    await user.click(screen.getByRole('button', { name: 'はじめる' }));
    expect(screen.getByRole('button', { name: 'とめる' })).toBeInTheDocument();
    // 開始直後はリードイン(そのまま)から始まる
    expect(screen.getByRole('status')).toHaveTextContent('そのまま');

    await user.click(screen.getByRole('button', { name: 'とめる' }));
    expect(screen.getByRole('button', { name: 'はじめる' })).toBeInTheDocument();
  });

  it('せっていボタンはタップ領域と独立して動く', async () => {
    const user = userEvent.setup();
    render(Page);

    await user.click(screen.getByRole('button', { name: 'せってい' }));
    // 設定シートが開き、ガイドは開始されない
    expect(screen.getByRole('button', { name: 'はじめる' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('rAF ループでリードイン→フェーズ進行する', async () => {
    // rAF のコールバックを捕捉し、テスト側から任意のタイムスタンプで手動駆動する
    const frames: FrameRequestCallback[] = [];
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
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
      expect(screen.getByRole('status')).toHaveTextContent('そのまま');
      expect(frames.length).toBeGreaterThan(0);

      // リードイン 1.5 秒 → すって(4秒)→ はいて(6秒)
      frames[frames.length - 1](base + 1600);
      await tick();
      expect(screen.getByRole('status')).toHaveTextContent('すって');

      // 1.5 + 4 = 5.5 秒以降は「はいて」(数msのドリフトは 5500〜11500ms の窓に収まる)
      frames[frames.length - 1](base + 5700);
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
