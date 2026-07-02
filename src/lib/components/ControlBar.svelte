<script lang="ts">
  let { running, onstart, onstop }: { running: boolean; onstart: () => void; onstop: () => void } = $props();
</script>

<button type="button" class="control" onclick={running ? onstop : onstart}>
  {running ? 'とめる' : 'はじめる'}
</button>

<style>
  .control {
    min-width: 200px;
    min-height: 56px;
    border-radius: 28px;
    background: var(--button-bg);
    color: var(--button-fg);
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }
</style>
