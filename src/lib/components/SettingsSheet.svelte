<script lang="ts">
  import { PRESETS } from '$lib/breathing/presets';
  import type { Settings } from '$lib/settings.svelte';
  import { THEME_IDS, THEMES, type ThemeSetting } from '$lib/themes';

  let { open = $bindable(false), settings }: { open: boolean; settings: Settings } = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  // Vibration API 対応端末(Android 等)のみトグルを表示する。
  // iOS Safari は 26.5 で隠しスイッチのハックが塞がれ、Web からの触覚出力手段が無い
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const themeOptions: { id: ThemeSetting; label: string }[] = [
    { id: 'auto', label: 'おまかせ(時間帯でかわる)' },
    ...THEME_IDS.map((id) => ({ id, label: THEMES[id].label }))
  ];

  const sliders = [
    { key: 'inhale', label: 'すう', min: 1 },
    { key: 'holdIn', label: 'とめる(すったあと)', min: 0 },
    { key: 'exhale', label: 'はく', min: 1 },
    { key: 'holdOut', label: 'とめる(はいたあと)', min: 0 }
  ] as const;

  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) dialogEl.showModal();
    if (!open && dialogEl.open) dialogEl.close();
  });
</script>

<!-- バックドロップのクリックは dialog 自身が target になることを利用して閉じる(キーボードは Esc が担う) -->
<dialog
  bind:this={dialogEl}
  class="sheet"
  aria-labelledby="settings-title"
  onclose={() => (open = false)}
  onclick={(e) => {
    if (e.target === dialogEl) open = false;
  }}
>
  <h2 id="settings-title">せってい</h2>

  <fieldset>
    <legend>呼吸のパターン</legend>
    {#each PRESETS as preset (preset.id)}
      <label class="preset">
        <input
          type="radio"
          name="preset"
          value={preset.id}
          aria-label={preset.name}
          aria-describedby={`preset-desc-${preset.id}`}
          checked={settings.presetId === preset.id}
          onchange={() => settings.selectPreset(preset.id)}
        />
        <span class="preset-text">
          <span>{preset.name}</span>
          <span class="preset-desc" id={`preset-desc-${preset.id}`}>{preset.description}</span>
        </span>
      </label>
    {/each}
  </fieldset>

  <fieldset>
    <legend>テーマ</legend>
    {#each themeOptions as option (option.id)}
      <label class="preset">
        <input
          type="radio"
          name="theme"
          value={option.id}
          checked={settings.theme === option.id}
          onchange={() => settings.setTheme(option.id)}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </fieldset>

  <fieldset>
    <legend>秒数の調整</legend>
    {#each sliders as slider (slider.key)}
      <label class="slider">
        <span>{slider.label}: {settings.custom[slider.key]}秒</span>
        <input
          type="range"
          min={slider.min}
          max="10"
          step="1"
          value={settings.custom[slider.key]}
          oninput={(e) => settings.updateCustom({ [slider.key]: e.currentTarget.valueAsNumber })}
        />
      </label>
    {/each}
  </fieldset>

  {#if canVibrate}
    <label class="vibration">
      <input
        type="checkbox"
        checked={settings.vibration}
        onchange={(e) => settings.setVibration(e.currentTarget.checked)}
      />
      <span>振動で呼吸のリズムを伝える</span>
    </label>
  {/if}
</dialog>

<style>
  .sheet {
    width: min(100%, 420px);
    /* 背後のテーマの変化が見えるよう、画面全体は覆わない */
    max-height: 55dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin: auto auto 0;
    border: none;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
    background: var(--bg);
    color: var(--fg);
  }

  /* 背後が見えるよう、うっすらとだけ暗くする */
  .sheet::backdrop {
    background: rgba(0, 0, 0, 0.12);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
  }

  fieldset {
    border: none;
    margin: 0 0 1rem;
    padding: 0;
  }

  legend {
    font-size: 0.875rem;
    color: var(--fg-soft);
    padding: 0;
    margin-bottom: 0.5rem;
  }

  .preset,
  .slider,
  .vibration {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
  }

  .preset-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.375rem 0;
  }

  .preset-desc {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--fg-soft);
  }

  .slider {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }

  .slider input {
    width: 100%;
    min-height: 44px;
  }
</style>
