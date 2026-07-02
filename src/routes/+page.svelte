<script lang="ts">
  import { BreathingEngine } from '$lib/breathing/engine';
  import type { PhaseName } from '$lib/breathing/types';
  import { createSettings } from '$lib/settings.svelte';
  import { resolveAutoTheme, THEMES } from '$lib/themes';
  import BreathingCircle from '$lib/components/BreathingCircle.svelte';
  import SettingsSheet from '$lib/components/SettingsSheet.svelte';

  // タップから最初の「すって」までの間(呼吸に合流するための静止時間)
  const LEAD_IN_SECONDS = 1.5;

  const settings = createSettings();
  const engine = new BreathingEngine();

  let engineState = $state(engine.state);
  let sheetOpen = $state(false);
  let rafId = 0;
  let wakeLock: WakeLockSentinel | null = null;

  function frame(now: number) {
    engineState = engine.tick(now);
    rafId = requestAnimationFrame(frame);
  }

  function startGuide() {
    engine.start({ ...settings.custom }, performance.now(), LEAD_IN_SECONDS);
    if (!engine.state.running) {
      engineState = engine.state;
      return;
    }
    engineState = engine.state;
    rafId = requestAnimationFrame(frame);
    void acquireWakeLock();
  }

  function stopGuide() {
    cancelAnimationFrame(rafId);
    engine.stop();
    engineState = engine.state;
    void releaseWakeLock();
  }

  function toggleGuide() {
    if (engineState.running) {
      stopGuide();
    } else {
      startGuide();
    }
  }

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      wakeLock = null; // 非対応・拒否時はスリープ防止なしで動作する
    }
  }

  async function releaseWakeLock() {
    try {
      await wakeLock?.release();
    } catch {
      // すでに解放済みなら何もしない
    }
    wakeLock = null;
  }

  // 設定変更は次サイクルの頭から反映する
  $effect(() => {
    engine.setPattern({ ...settings.custom });
  });

  // テーマ: 「おまかせ」は時間帯で自動選択し、1分ごとに再評価する
  let hour = $state(new Date().getHours());
  $effect(() => {
    const id = setInterval(() => (hour = new Date().getHours()), 60_000);
    return () => clearInterval(id);
  });
  const activeTheme = $derived(settings.theme === 'auto' ? resolveAutoTheme(hour) : settings.theme);
  $effect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[activeTheme].colors.bg);
  });

  // フェーズ切替時の振動(設定オン かつ 対応端末のみ)
  let prevPhase: PhaseName = engine.state.phase;
  $effect(() =>
    engine.subscribe((s) => {
      if (s.running && s.phase !== prevPhase && settings.vibration && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
      prevPhase = s.phase;
    })
  );

  // 画面復帰時に Wake Lock を取り直す
  $effect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && engineState.running) void acquireWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  });

  $effect(() => () => cancelAnimationFrame(rafId));
</script>

<svelte:head>
  <title>ひといき</title>
  <meta name="description" content="呼吸に意識を向けるためのガイド" />
</svelte:head>

<main class="app" class:running={engineState.running}>
  <!-- 画面のどこを押しても開始/停止できる(狙って押す負荷をなくす) -->
  <button type="button" class="tap-area" aria-label={engineState.running ? 'とめる' : 'はじめる'} onclick={toggleGuide}>
    <BreathingCircle
      phase={engineState.phase}
      phaseProgress={engineState.phaseProgress}
      running={engineState.running}
    />
  </button>
  <button type="button" class="settings-button" onclick={() => (sheetOpen = true)}> せってい </button>
</main>

<SettingsSheet bind:open={sheetOpen} {settings} />

<style>
  .app {
    position: relative;
    min-height: 100dvh;
  }

  .tap-area {
    position: absolute;
    inset: 0;
    width: 100%;
    display: grid;
    place-items: center;
    padding: 0;
    border-radius: 0;
  }

  .tap-area:focus-visible {
    outline-offset: -4px;
  }

  .settings-button {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top));
    right: 0.75rem;
    z-index: 1;
    padding: 0.5rem 1rem;
    color: var(--fg-soft);
    transition: opacity 0.4s;
  }

  /* 実行中は視界のノイズを減らす */
  .running .settings-button {
    opacity: 0.35;
  }

  /* キーボード操作時はフォーカスを隠さない */
  .running .settings-button:focus-visible {
    opacity: 1;
  }
</style>
