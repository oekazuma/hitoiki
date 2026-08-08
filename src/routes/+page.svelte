<script lang="ts">
  import { BreathingEngine } from '$lib/breathing/engine';
  import type { PhaseName } from '$lib/breathing/types';
  import { PHASE_VIBRATION, TAP_VIBRATION, vibrate } from '$lib/haptics';
  import { createSettings } from '$lib/settings.svelte';
  import { resolveAutoTheme, THEMES } from '$lib/themes';
  import { acquireWakeLock, releaseWakeLock } from '$lib/wake-lock';
  import BreathingCircle from '$lib/components/BreathingCircle.svelte';
  import LogoMark from '$lib/components/LogoMark.svelte';
  import SettingsSheet from '$lib/components/SettingsSheet.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import SiteMeta from '$lib/components/SiteMeta.svelte';

  // タップから最初の「すって」までの間(呼吸に合流するための静止時間)
  const LEAD_IN_SECONDS = 1.5;

  const settings = createSettings();
  const engine = new BreathingEngine();

  let engineState = $state(engine.state);
  let sheetOpen = $state(false);
  let rafId = 0;

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
    // タップの合図(振動対応環境のみ)
    if (settings.vibration) vibrate(TAP_VIBRATION);
  }

  // 設定変更は次サイクルの頭から反映する
  const pattern = $derived(settings.custom);
  $effect(() => {
    engine.setPattern({ ...pattern });
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

  // フェーズ切替時の触覚(設定オンのときのみ)
  let prevPhase: PhaseName = engine.state.phase;
  $effect(() =>
    engine.subscribe((s) => {
      if (s.running && s.phase !== prevPhase && settings.vibration) {
        const pattern = PHASE_VIBRATION[s.phase];
        if (pattern !== undefined) vibrate(pattern);
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

<SiteMeta />

<div class="app">
  <header class="site-header" class:hidden={engineState.running}>
    <LogoMark />
    <h1 class="logo-text">ひといき</h1>
  </header>

  <main class="stage">
    <!-- 画面のどこを押しても開始/停止できる(狙って押す負荷をなくす) -->
    <button
      type="button"
      class="tap-area"
      aria-label={engineState.running ? 'とめる' : 'はじめる'}
      onclick={toggleGuide}
    >
      <BreathingCircle
        phase={engineState.phase}
        phaseProgress={engineState.phaseProgress}
        running={engineState.running}
      />
    </button>
  </main>

  <SiteFooter {settings} hidden={engineState.running} />

  <button type="button" class="settings-button" class:hidden={engineState.running} onclick={() => (sheetOpen = true)}>
    せってい
  </button>
</div>

<SettingsSheet bind:open={sheetOpen} {settings} />

<style>
  .app {
    position: relative;
    min-height: 100dvh;
  }

  .stage {
    display: contents;
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

  .site-header {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top));
    left: 1rem;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    pointer-events: none;
  }

  .logo-text {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .settings-button {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top));
    right: 0.75rem;
    z-index: 1;
    padding: 0.5rem 1rem;
    color: var(--fg-soft);
  }

  /* 実行中は呼吸の UI 以外を隠す(フッターは SiteFooter 側で同じ扱い) */
  .site-header,
  .settings-button {
    transition:
      opacity 0.4s,
      visibility 0.4s;
  }

  .hidden {
    opacity: 0;
    visibility: hidden;
  }
</style>
