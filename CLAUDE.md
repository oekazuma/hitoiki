# CLAUDE.md

ひといき — 画面に合わせて呼吸するだけの、呼吸ガイド PWA。SvelteKit + Svelte 5(runes)で作られた静的サイトで、GitHub Pages に配信している。バックエンド・ユーザー登録・トラッキングは無い。

## コマンド

pnpm を使う(Corepack 経由、`packageManager` はリポジトリで固定)。

| 目的                  | コマンド        |
| --------------------- | --------------- |
| 開発サーバ            | `pnpm dev`      |
| 本番ビルド            | `pnpm build`    |
| 型チェック            | `pnpm check`    |
| Lint(prettier+eslint) | `pnpm lint`     |
| 自動整形              | `pnpm format`   |
| テスト(watch)         | `pnpm test`     |
| テスト(1 回)          | `pnpm test:run` |
| アイコン再生成        | `pnpm icons`    |

変更を出す前に最低限 `pnpm check`・`pnpm lint`・`pnpm test:run`・`pnpm build` を通すこと(CI と同じ)。

## 構成

- `src/routes/+page.svelte` — 画面本体。タップで開始/停止、rAF ループ、Wake Lock、触覚、テーマ適用。
- `src/lib/breathing/` — 呼吸ロジック(UI 非依存)。
  - `engine.ts` — `BreathingEngine`。時刻を外部(rAF)から受け取るステートマシン。
  - `presets.ts` — プリセットと `clampPattern`。
  - `types.ts` — フェーズ定義とラベル。
- `src/lib/settings.svelte.ts` — 設定ストア(runes)。localStorage に永続化(キー `hitoiki:settings:v1`)。読み込み時にスキーマ検証+クランプ。
- `src/lib/themes.ts` — テーマパレットと `resolveAutoTheme`(時間帯おまかせ)。
- `src/lib/components/` — `BreathingCircle` / `SettingsSheet` / `InstallHint`。
- `src/app.html` — 描画前のちらつき防止インラインスクリプト(テーマを描画前に適用)。
- `src/service-worker.ts` — オフライン用 cache-first。`skipWaiting` は使わない(利用中に画面を変えないため、次回起動で更新)。

配信: `prerender = true`(`+layout.ts`)、`adapter-static`。GitHub Pages のサブパス用に build 時 `BASE_PATH=/<repo>` を渡す(`svelte.config.js`)。

## 規約

- Svelte 5 runes を使う(`$state` / `$derived` / `$props` / `$effect` / `$bindable`)。旧来の `export let` やストア(`writable`)は使わない。
- ロジックは UI 非依存に切り出す(クラス or 純関数)。テストは `src/**/*.test.ts`。
- コミットは Conventional Commits(日本語本文可。例: `fix: ...` / `feat: ...` / `docs: ...`)。
- コメント・UI 文言は日本語。整形は prettier(シングルクォート・セミコロンあり・printWidth 120)。
- 依存は `pnpm-workspace.yaml` の catalog で管理し、`package.json` では `catalog:` 参照+`devDependencies` に統一する。

## 重要: 手で揃える必要がある箇所

以下は複数ファイルに同じ値が複製されている。片方だけ変えると初回描画が壊れる(一部はテストがガードするが、変更時は必ず両方直すこと)。

1. テーマの配色 — `src/lib/themes.ts` の `THEMES` ↔ `src/app.css` の `[data-theme=...]` ↔ `src/app.html` のインライン背景色マップ。`src/lib/themes.test.ts` が同期を検証する。
2. 時間帯おまかせの判定 — `src/lib/themes.ts` の `resolveAutoTheme` ↔ `src/app.html` のインライン三項演算子。`src/lib/themes.test.ts` が同期を検証する。
3. localStorage キー — `src/lib/settings.svelte.ts` の `STORAGE_KEY` ↔ `src/app.html` のインラインスクリプト内リテラル `'hitoiki:settings:v1'`。

## テスト

- Vitest + happy-dom + Testing Library。ロジックは純粋テスト、画面は Testing Library で操作をシミュレート。
- `themes.test.ts` は WCAG コントラスト比の回帰ガードと、ソース間の値の同期検証を持つ。テーマや時間帯判定を変えるときはこのテストが基準。

## プロダクトの方針

意図的にミニマル: 登録なし・音なし・トラッキングなし・医療目的ではない。機能追加はこの方針と矛盾しないか確認すること。
