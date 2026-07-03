import { describe, expect, it } from 'vitest';
import { createSettings, loadSettings, saveSettings, STORAGE_KEY, type SettingsData } from './settings.svelte';

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    dump: () => Object.fromEntries(map)
  };
}

const DEFAULTS: SettingsData = {
  presetId: 'gentle',
  custom: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
  vibration: false,
  theme: 'auto',
  installHintDismissed: false
};

describe('loadSettings', () => {
  it('storage が null ならデフォルトを返す', () => {
    expect(loadSettings(null)).toEqual(DEFAULTS);
  });

  it('保存が無ければデフォルトを返す', () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULTS);
  });

  it('保存済みの設定を復元する', () => {
    const data: SettingsData = {
      presetId: 'box',
      custom: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
      vibration: true,
      theme: 'moon',
      installHintDismissed: true
    };
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(data) });
    expect(loadSettings(storage)).toEqual(data);
  });

  it('壊れた JSON はデフォルトにフォールバックする', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{oops' });
    expect(loadSettings(storage)).toEqual(DEFAULTS);
  });

  it('範囲外の秒数は丸めて復元する', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        presetId: 'custom',
        custom: { inhale: 0, holdIn: 99, exhale: 6, holdOut: 0 },
        vibration: false
      })
    });
    expect(loadSettings(storage).custom).toEqual({ inhale: 1, holdIn: 10, exhale: 6, holdOut: 0 });
  });

  it('getItem が throw してもデフォルトを返す(プライベートモード)', () => {
    const storage = {
      getItem: () => {
        throw new Error('denied');
      }
    };
    expect(loadSettings(storage)).toEqual(DEFAULTS);
  });
});

describe('saveSettings', () => {
  it('JSON で保存する', () => {
    const storage = fakeStorage();
    saveSettings(storage, DEFAULTS);
    expect(JSON.parse(storage.dump()[STORAGE_KEY])).toEqual(DEFAULTS);
  });

  it('setItem が throw しても壊れない', () => {
    const storage = {
      setItem: () => {
        throw new Error('quota');
      }
    };
    expect(() => saveSettings(storage, DEFAULTS)).not.toThrow();
  });
});

describe('createSettings', () => {
  it('プリセット選択でパターンが custom にコピーされ保存される', () => {
    const storage = fakeStorage();
    const settings = createSettings(storage as unknown as Storage);
    settings.selectPreset('box');
    expect(settings.presetId).toBe('box');
    expect(settings.custom).toEqual({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 });
    expect(JSON.parse(storage.dump()[STORAGE_KEY]).presetId).toBe('box');
  });

  it('スライダー変更で presetId が custom になり clamp される', () => {
    const settings = createSettings(fakeStorage() as unknown as Storage);
    settings.updateCustom({ inhale: 99 });
    expect(settings.presetId).toBe('custom');
    expect(settings.custom.inhale).toBe(10);
  });

  it('振動設定を保存する', () => {
    const storage = fakeStorage();
    const settings = createSettings(storage as unknown as Storage);
    settings.setVibration(true);
    expect(settings.vibration).toBe(true);
    expect(JSON.parse(storage.dump()[STORAGE_KEY]).vibration).toBe(true);
  });

  it('テーマ設定を保存する', () => {
    const storage = fakeStorage();
    const settings = createSettings(storage as unknown as Storage);
    expect(settings.theme).toBe('auto');
    settings.setTheme('night');
    expect(settings.theme).toBe('night');
    expect(JSON.parse(storage.dump()[STORAGE_KEY]).theme).toBe('night');
  });

  it('不正なテーマ値は auto にフォールバックする', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ ...DEFAULTS, theme: 'rainbow' })
    });
    expect(loadSettings(storage).theme).toBe('auto');
  });

  it('インストールヒントの既読を保存する', () => {
    const storage = fakeStorage();
    const settings = createSettings(storage as unknown as Storage);
    expect(settings.installHintDismissed).toBe(false);
    settings.dismissInstallHint();
    expect(settings.installHintDismissed).toBe(true);
    expect(JSON.parse(storage.dump()[STORAGE_KEY]).installHintDismissed).toBe(true);
  });
});
