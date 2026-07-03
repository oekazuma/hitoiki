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

  // プリレンダー済み HTML にヒントを含めないためのフラグ。マウント後にだけ表示判定することで、
  // 閉じ済みの人にヒントが一瞬見えて消える(リロード時の)ちらつきを防ぐ。
  let mounted = $state(false);

  $effect(() => {
    mounted = true;
    const onPrompt = (e: Event) => {
      e.preventDefault(); // ブラウザ自動バナーを抑え、こちらの導線から出す
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  });

  const installed = $derived(standalone.current || iosStandalone);
  const visible = $derived(mounted && !installed && !settings.installHintDismissed);

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
        ホーム画面に追加すると、電波がなくてもすぐ開けます<span class="how"
          >(<svg class="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" role="img" aria-label="共有">
            <path d="M12 15V3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8 7l4-4 4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path
              d="M20 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg> → ホーム画面に追加)</span
        >
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
    /* マウント後にそっと現れる(ちらつき防止の一環) */
    animation: fade-in 0.5s ease;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .install-hint {
      animation: none;
    }
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
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    opacity: 0.85;
  }

  .share-icon {
    width: 1em;
    height: 1em;
    margin: 0 0.15em;
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
