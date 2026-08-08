import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireWakeLock, releaseWakeLock } from './wake-lock';

function mockWakeLock(request: () => Promise<WakeLockSentinel>) {
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('wake-lock', () => {
  it('取得したロックを解放する', async () => {
    const release = vi.fn(() => Promise.resolve());
    mockWakeLock(() => Promise.resolve({ release } as unknown as WakeLockSentinel));

    await acquireWakeLock();
    await releaseWakeLock();
    expect(release).toHaveBeenCalledTimes(1);

    // 解放後にもう一度呼んでも二重解放しない
    await releaseWakeLock();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('非対応・拒否でも例外を投げない', async () => {
    await expect(acquireWakeLock()).resolves.toBeUndefined(); // navigator.wakeLock 自体が無い
    mockWakeLock(() => Promise.reject(new Error('denied')));
    await expect(acquireWakeLock()).resolves.toBeUndefined();
    await expect(releaseWakeLock()).resolves.toBeUndefined();
  });
});
