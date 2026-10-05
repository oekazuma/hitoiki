import { describe, expect, it } from 'vitest';
import { ours, passthrough, stale } from './sw-rules';

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

describe('passthrough', () => {
  it('新バージョン確認用の version.json だけをキャッシュせず素通しする', () => {
    expect(passthrough('/hitoiki/_app/version.json')).toBe(true);
    expect(passthrough('/_app/version.json')).toBe(true);
    expect(passthrough('/hitoiki/_app/immutable/entry/app.js')).toBe(false);
    expect(passthrough('/hitoiki/')).toBe(false);
  });
});
