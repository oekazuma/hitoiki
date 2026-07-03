# web-haptics の削除とネイティブ Vibration API への移行

## 背景

触覚フィードバックに `web-haptics`(`WebHaptics.trigger(Vibration[])`)を使っている。これは iOS 18+ Safari のシステム触覚を狙った設計だったが、iOS Safari 26.5 でその手段が塞がれ、iOS では動作しない。一方 Android は `navigator.vibrate` が使えるので、そちらに一本化して呼吸ガイドの触覚を維持する。

## 方針

- `web-haptics` を依存から削除する。
- Android(および `navigator.vibrate` を持つ環境)向けに、ネイティブの Vibration API を直接使う。
- ネイティブ `navigator.vibrate()` は**強弱(intensity)を持てない**(ミリ秒単位のオン/オフの並びのみ)。現状 intensity で表現していた「強め/弱く」は、**長さと回数**へ翻訳する。
- iOS は `navigator.vibrate` を持たないため、この機能は自然に無効化される(設定トグルは既存の `'vibrate' in navigator` 判定で非表示)。

## 振動パターンの再設計

| フェーズ          | 現状(web-haptics) | ネイティブ `vibrate` | 意図        |
| ----------------- | ----------------- | -------------------- | ----------- |
| タップ(開始/停止) | 30ms / 弱         | `30`                 | 操作の合図  |
| すって(inhale)    | 60ms / 強         | `60`                 | 長めの 1 回 |
| とめて(holdIn)    | 25ms / 弱         | `25`                 | 短く軽く    |
| はいて(exhale)    | 50ms×2 / 強       | `[50, 90, 50]`       | 2 回        |
| とめて(holdOut)   | 25ms / 弱         | `25`                 | 短く軽く    |

## 構成(UI 非依存に切り出す規約に沿う)

- 新規 `src/lib/haptics.ts` — 純粋モジュール。
  - `PHASE_VIBRATION: Partial<Record<PhaseName, number | number[]>>` — フェーズ→振動パターン。
  - `TAP_VIBRATION: number` — 開始/停止の合図。
  - `canVibrate(): boolean` — `typeof navigator !== 'undefined' && 'vibrate' in navigator`。
  - `vibrate(pattern: number | number[]): void` — `canVibrate()` を確認し、`try/catch` で `navigator.vibrate` を呼ぶ(非対応・拒否時は no-op)。
- 新規 `src/lib/haptics.test.ts` — パターン定義、ガイド対象フェーズの対応、非対応環境での no-op、`navigator.vibrate` への引数を検証。
- `src/routes/+page.svelte` — `web-haptics` の import・`haptics` インスタンス・`hapticsInstance()`・`PHASE_HAPTICS`・破棄 `$effect` を削除し、`haptics.ts` の関数呼び出しに置換。
  - タップ: `if (settings.vibration) vibrate(TAP_VIBRATION)`
  - フェーズ切替: `const pattern = PHASE_VIBRATION[s.phase]; if (pattern !== undefined) vibrate(pattern)`
- `src/lib/components/SettingsSheet.svelte` — 重複する対応判定を `haptics.ts` の `canVibrate()` に置き換える(挙動は同じ)。
- `package.json` の `web-haptics` と `pnpm-workspace.yaml` catalog の `web-haptics` を削除。

## テスト・検証

- `pnpm check` / `pnpm lint` / `pnpm test:run` / `pnpm build` を通す。
- 既存の SettingsSheet テスト(非対応環境でトグル非表示)はそのまま通ること。

## 非目標

- 強弱表現の復活(ネイティブ API では不可能)。
- iOS 向けの代替触覚手段の追加。
