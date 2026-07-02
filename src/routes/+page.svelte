<script lang="ts">
  import { WebHaptics, type Vibration } from 'web-haptics';
  import { BreathingEngine } from '$lib/breathing/engine';
  import type { PhaseName } from '$lib/breathing/types';
  import { createSettings } from '$lib/settings.svelte';
  import { resolveAutoTheme, THEMES } from '$lib/themes';
  import BreathingCircle from '$lib/components/BreathingCircle.svelte';
  import SettingsSheet from '$lib/components/SettingsSheet.svelte';

  // タップから最初の「すって」までの間(呼吸に合流するための静止時間)
  const LEAD_IN_SECONDS = 1.5;

  const REPO_URL = 'https://github.com/oekazuma/hitoiki';

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
    // タップの合図(ユーザー操作の直後に発火させることで iOS でも確実に鳴る)
    if (settings.vibration) {
      void hapticsInstance().trigger([{ duration: 30, intensity: 0.4 }]);
    }
  }

  // 触覚フィードバック(web-haptics: Android は Vibration API、iOS 18+ Safari はシステム触覚)
  let haptics: WebHaptics | null = null;
  function hapticsInstance(): WebHaptics {
    haptics ??= new WebHaptics();
    return haptics;
  }
  $effect(() => () => haptics?.destroy());

  // フェーズごとのパターン: 目を閉じていても「すって(1回)/はいて(2回)/とめて(弱く)」が分かるように
  const PHASE_HAPTICS: Partial<Record<PhaseName, Vibration[]>> = {
    inhale: [{ duration: 60, intensity: 0.6 }],
    holdIn: [{ duration: 25, intensity: 0.35 }],
    exhale: [
      { duration: 50, intensity: 0.6 },
      { delay: 90, duration: 50, intensity: 0.6 }
    ],
    holdOut: [{ duration: 25, intensity: 0.35 }]
  };

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

  // フェーズ切替時の触覚(設定オンのときのみ)
  let prevPhase: PhaseName = engine.state.phase;
  $effect(() =>
    engine.subscribe((s) => {
      if (s.running && s.phase !== prevPhase && settings.vibration) {
        const pattern = PHASE_HAPTICS[s.phase];
        if (pattern) void hapticsInstance().trigger(pattern);
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
  <meta name="description" content="すって、はいて、ひといき。画面に合わせて呼吸するだけの、呼吸ガイドです。" />
</svelte:head>

<div class="app" class:running={engineState.running}>
  <header class="site-header">
    <svg class="logo-mark" viewBox="0 0 160 160" aria-hidden="true">
      <circle
        cx="80"
        cy="80"
        r="66"
        fill="none"
        stroke="var(--circle-bg)"
        stroke-width="8"
        stroke-linecap="round"
        stroke-dasharray="311 104"
        transform="rotate(-90 80 80)"
      />
      <circle cx="80" cy="80" r="52" fill="var(--circle-bg)" opacity="0.45" />
      <circle cx="80" cy="80" r="38" fill="var(--circle-bg)" />
    </svg>
    <span class="logo-text">ひといき</span>
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

  <footer class="site-footer">
    <p class="disclaimer">ひといきは医療行為を目的としたものではありません</p>
    <p class="footer-links">
      <a href="{REPO_URL}/blob/main/LICENSE.md" target="_blank" rel="noopener noreferrer">MIT License</a>
      <span aria-hidden="true">·</span>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub リポジトリ">
        <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
      </a>
    </p>
  </footer>

  <button type="button" class="settings-button" onclick={() => (sheetOpen = true)}> せってい </button>
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

  .logo-mark {
    width: 28px;
    height: 28px;
  }

  .logo-text {
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

  .site-footer {
    position: absolute;
    inset: auto 0 calc(0.5rem + env(safe-area-inset-bottom));
    z-index: 1;
    text-align: center;
    font-size: 0.75rem;
    color: var(--fg-soft);
  }

  .site-footer p {
    margin: 0;
  }

  .footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }

  .footer-links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 0.5rem;
    color: inherit;
  }

  .github-icon {
    width: 18px;
    height: 18px;
  }

  /* 実行中は呼吸のUI以外をすべて非表示にする */
  .site-header,
  .site-footer,
  .settings-button {
    transition:
      opacity 0.4s,
      visibility 0.4s;
  }

  .running .site-header,
  .running .site-footer,
  .running .settings-button {
    opacity: 0;
    visibility: hidden;
  }
</style>
