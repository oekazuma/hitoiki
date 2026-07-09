<script lang="ts">
  // svelte-vitals の動作確認用の一時ファイル(マージ前に削除する)。
  // CORRECT002: $effect が状態を代入するだけ($derived に置き換え可能)。
  let count = $state(0);
  let doubled = $state(0);
  $effect(() => {
    doubled = count * 2;
  });
</script>

<p>{doubled}</p>
