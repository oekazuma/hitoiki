<script lang="ts">
  import { PRESETS } from '$lib/breathing/presets';
  import type { Settings } from '$lib/settings.svelte';

  let { open = $bindable(false), settings }: { open: boolean; settings: Settings } = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

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

<dialog bind:this={dialogEl} class="sheet" aria-labelledby="settings-title" onclose={() => (open = false)}>
  <h2 id="settings-title">せってい</h2>

  <fieldset>
    <legend>呼吸のパターン</legend>
    {#each PRESETS as preset (preset.id)}
      <label class="preset">
        <input
          type="radio"
          name="preset"
          value={preset.id}
          checked={settings.presetId === preset.id}
          onchange={() => settings.selectPreset(preset.id)}
        />
        <span>{preset.name}</span>
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
      <span>フェーズの切り替わりで振動する</span>
    </label>
  {/if}

  <button type="button" class="close" onclick={() => (open = false)}>とじる</button>
</dialog>

<style>
  .sheet {
    width: min(100%, 420px);
    margin: auto auto 0;
    border: none;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
    background: var(--bg);
    color: var(--fg);
  }

  .sheet::backdrop {
    background: rgba(0, 0, 0, 0.4);
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

  .slider {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }

  .slider input {
    width: 100%;
    min-height: 44px;
  }

  .close {
    width: 100%;
    min-height: 48px;
    border-radius: 24px;
    background: var(--button-bg);
    color: var(--button-fg);
    font-weight: 600;
  }
</style>
