<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import type { Settings } from '$lib/settings.svelte';

  let { settings }: { settings: Settings } = $props();

  // beforeinstallprompt を発火するブラウザ(Android Chrome 等)のイベント
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
  }

  const standalone = new MediaQuery('(display-mode: standalone)');
  // iOS Safari のホーム画面起動フラグ(型定義には無いため any 経由で参照)
  const iosStandalone =
    typeof navigator !== 'undefined' && (navigator as unknown as { standalone?: boolean }).standalone === true;

  let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);

  $effect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // ブラウザ自動バナーを抑え、こちらの導線から出す
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  });

  const installed = $derived(standalone.current || iosStandalone);
  const visible = $derived(!installed && !settings.installHintDismissed);

  async function install() {
    if (deferredPrompt) {
      // Android: ネイティブのインストール確認を出す
      await deferredPrompt.prompt();
      deferredPrompt = null;
      settings.dismissInstallHint();
    }
    // iOS など prompt が無い環境では、文中の手順を読んでもらう(タップ自体は無反応でよい)
  }
</script>

{#if visible}
  <div class="install-hint" role="note">
    {#if deferredPrompt}
      <button type="button" class="hint-text" onclick={install}>
        ホーム画面に追加すると、電波がなくてもすぐ開けます
      </button>
    {:else}
      <span class="hint-text static">
        ホーム画面に追加すると、電波がなくてもすぐ開けます<span class="how">(共有 → ホーム画面に追加)</span>
      </span>
    {/if}
    <button type="button" class="dismiss" aria-label="閉じる" onclick={() => settings.dismissInstallHint()}>×</button>
  </div>
{/if}

<style>
  .install-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--fg-soft);
  }

  .hint-text {
    color: inherit;
    font: inherit;
    text-align: center;
    padding: 0.25rem 0.5rem;
    min-height: auto;
  }

  .hint-text.static {
    padding: 0.25rem 0.5rem;
  }

  .how {
    white-space: nowrap;
    opacity: 0.85;
  }

  .dismiss {
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
    color: inherit;
    font-size: 1rem;
    line-height: 1;
  }
</style>
