import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAutoTheme, THEME_IDS, THEMES } from './themes';

describe('resolveAutoTheme(時間帯おまかせ)', () => {
  it.each([
    [0, 'night'],
    [4, 'night'],
    [5, 'sea'],
    [9, 'sea'],
    [10, 'forest'],
    [15, 'forest'],
    [16, 'sunset'],
    [18, 'sunset'],
    [19, 'night'],
    [23, 'night']
  ])('%i 時 → %s', (hour, expected) => {
    expect(resolveAutoTheme(hour)).toBe(expected);
  });
});

// WCAG コントラスト比(全テーマの恒久的な回帰ガード)
function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe.each(THEME_IDS)('テーマ %s のコントラスト(WCAG AA)', (id) => {
  const c = THEMES[id].colors;
  const backgrounds = [c.bg, ...(c.bg2 ? [c.bg2] : [])];

  it.each(backgrounds)('テキストは背景 %s に対して 4.5:1 以上', (bg) => {
    expect(contrast(c.fg, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.fgSoft, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(backgrounds)('進捗リングは背景 %s に対して 3:1 以上', (bg) => {
    expect(contrast(c.ringFg, bg)).toBeGreaterThanOrEqual(3);
  });

  it('円内テキストは円に対して 4.5:1 以上', () => {
    expect(contrast(c.circleFg, c.circleBg)).toBeGreaterThanOrEqual(4.5);
  });
});

// themes.ts と app.css の値がずれないことを保証する
describe('app.css との同期', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf-8');

  it.each(THEME_IDS)('%s のパレットが app.css に反映されている', (id) => {
    const block = css.split(`[data-theme='${id}']`)[1]?.split('}')[0] ?? '';
    const c = THEMES[id].colors;
    for (const hex of [c.bg, c.fg, c.fgSoft, c.circleBg, c.circleFg, c.ringFg]) {
      expect(block).toContain(hex);
    }
  });
});

// app.html のちらつき防止スクリプトの時間帯判定が resolveAutoTheme とずれないことを保証する。
// インラインスクリプトは ES モジュールを import できないため時間窓を複製しており、
// 変更時に片方だけ直すと初回描画のテーマがアプリ本体と食い違う。それを検知する。
describe('app.html(ちらつき防止スクリプト)との同期', () => {
  const html = readFileSync(resolve(process.cwd(), 'src/app.html'), 'utf-8');

  // `theme = h >= 5 && ... : 'night';` の右辺(三項演算式)だけを取り出す
  const match = html.match(/theme = (h >= [\s\S]*?);/);

  it('時間帯判定の式が app.html から取り出せる', () => {
    expect(match).not.toBeNull();
  });

  it.each(Array.from({ length: 24 }, (_, h) => h))('%i 時の判定が resolveAutoTheme と一致する', (hour) => {
    const expr = match![1];
    const inlineResolve = new Function('h', `return ${expr};`) as (h: number) => string;
    expect(inlineResolve(hour)).toBe(resolveAutoTheme(hour));
  });
});

// app.html のちらつき防止スクリプトが持つ背景色マップ(theme-color 用)が
// themes.ts の THEMES[id].colors.bg とずれないことを保証する。
describe('app.html(theme-color の背景色マップ)との同期', () => {
  const html = readFileSync(resolve(process.cwd(), 'src/app.html'), 'utf-8');
  const match = html.match(/var BG = (\{[\s\S]*?\});/);

  it('背景色マップが app.html から取り出せる', () => {
    expect(match).not.toBeNull();
  });

  const inlineBg = match ? (new Function(`return ${match[1]};`) as () => Record<string, string>)() : {};

  it.each(THEME_IDS)('%s の theme-color 用背景色が themes.ts と一致する', (id) => {
    expect(inlineBg[id]).toBe(THEMES[id].colors.bg);
  });

  it('マップに余分な(themes.ts に無い)テーマ ID が無い', () => {
    expect(Object.keys(inlineBg).sort()).toEqual([...THEME_IDS].sort());
  });
});
