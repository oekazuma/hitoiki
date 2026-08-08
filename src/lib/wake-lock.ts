// 画面のスリープ防止(Screen Wake Lock API)。非対応・拒否された環境では
// スリープ防止なしでそのまま動作させる(呼び出し側でのエラー処理は不要)。
let sentinel: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator) sentinel = await navigator.wakeLock.request('screen');
  } catch {
    sentinel = null;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release();
  } catch {
    // すでに解放済みなら何もしない
  }
  sentinel = null;
}
