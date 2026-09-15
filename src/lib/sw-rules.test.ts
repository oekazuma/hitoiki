import { describe, expect, it } from 'vitest';
import { ours, stale } from './sw-rules';

describe('stale', () => {
  it('自分の旧キャッシュだけを消す対象にする', () => {
    expect(stale('hitoiki-1', 'hitoiki-2')).toBe(true);
    expect(stale('hitoiki-2', 'hitoiki-2')).toBe(false);
    expect(stale('kk-1-abc', 'hitoiki-2')).toBe(false);
  });
});

describe('ours', () => {
  it('姉妹アプリのキャッシュは自分のものと見なさない', () => {
    expect(ours('hitoiki-2')).toBe(true);
    expect(ours('kk-1-abc')).toBe(false);
  });
});
