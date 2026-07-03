# Vitest browser mode の導入(ハイブリッド)

## 背景

ブラウザ依存の強い実装(`<dialog>.showModal()`、`matchMedia`、`requestAnimationFrame`、`navigator.wakeLock` / `navigator.vibrate`)は、happy-dom ではスタブに頼るため忠実度が低い。実ブラウザで検証したいものは Vitest browser mode(Playwright / Chromium)で動かす。

ただし「ブラウザ依存が強い=実ブラウザが最適」ではない。テストの**制御可能性**で振り分ける:

- 実ブラウザが忠実で、かつ特別なエミュレーション不要 → browser project。
- `matchMedia`(`prefers-reduced-motion`)や PWA の `display-mode: standalone` / `beforeinstallprompt` に依存 → 実ブラウザではテスト単位の制御が難しく、happy-dom + スタブの方が確実 → unit project に据え置き。

## 方針(ハイブリッド)

ロジック系と制御が必要な DOM テストは happy-dom で高速に、ブラウザ依存が強く実ブラウザが忠実なテストだけ Chromium で。`test.projects` で 2 系統を併存させる。

## 構成

### テスト 2 系統(`vite.config.ts` の `test.projects`)

- **unit**(既存継続)
  - `environment: 'happy-dom'`
  - `setupFiles: ['./src/vitest-setup.ts']`
  - `include: ['src/**/*.test.ts']`、`exclude: ['src/**/*.browser.test.ts']`
- **browser**(新規)
  - `browser: { enabled: true, provider: playwright(), headless: true, instances: [{ browser: 'chromium' }] }`
  - `include: ['src/**/*.browser.test.ts']`
  - 実 DOM なので matchMedia 等のスタブは不要。jest-dom マッチャだけ読む軽量 setup(`src/vitest-setup.browser.ts`)。

### 依存

- `@vitest/browser-playwright` と `playwright` を `pnpm-workspace.yaml` の catalog に追加(vitest 4.1.9 互換版に固定)。`package.json` は `catalog:` 参照+`devDependencies`。
- Chromium バイナリは `pnpm exec playwright install chromium` で取得。

### 最初の移行対象(YAGNI: 高価値の 1 枚のみ)

`SettingsSheet` の `<dialog>` 挙動を `src/lib/components/SettingsSheet.browser.test.ts` へ:

- `showModal()` で開く / バックドロップクリックで閉じる / `Esc` で閉じる / 中身クリックでは閉じない。

現状は happy-dom で `showModal`/`close` をポリフィルして検証しているだけなので、実ブラウザが最も忠実。プリセット選択・テーマ・スライダー・振動トグル等のロジック寄りテストは `SettingsSheet.test.ts`(happy-dom)に残す(同一コンポーネントでもファイルを役割で分割)。

`BreathingCircle`(reduced-motion は matchMedia 制御が要る)と `InstallHint`(display-mode / beforeinstallprompt はエミュレート困難)は happy-dom に据え置き。

`*.browser.test.ts` 命名を、今後のブラウザ依存テスト(将来の実 wakeLock / vibrate 統合など)の受け皿として確立する。

### レンダリング API

既存と一貫させ `@testing-library/svelte` を browser project でもそのまま使う(実 DOM なので動作する想定)。動かない場合の代替として `vitest-browser-svelte`(locator ベース)を控えにする。

### スクリプト / CI

- `pnpm test:run` は両 project を 1 回実行(browser には Chromium が必要)。`--project unit` / `--project browser` で個別実行できる旨を CLAUDE.md に追記。
- `.github/workflows/ci.yml` の `test` ジョブに `pnpm exec playwright install --with-deps chromium` ステップを追加(依存インストール後・テスト実行前)。
- CLAUDE.md のテスト節を 2 系統構成に更新。

## テスト・検証

- `pnpm check` / `pnpm lint` / `pnpm test:run`(両 project) / `pnpm build` を通す。
- ローカルで Chromium を入れて browser project が実際に緑になることを確認する。

## 非目標

- 全テストの実ブラウザ移行(CI が重くなり、ミニマル方針と相反する)。
- 複数ブラウザ(WebKit / Firefox)対応。まずは Chromium のみ。
- `InstallHint` / `BreathingCircle` の実ブラウザ移行(制御可能性の観点で happy-dom が適切)。
