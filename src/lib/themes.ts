export const THEME_IDS = ['night', 'sea', 'forest', 'sunset', 'moon', 'cloud'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** 'auto' は時間帯によるおまかせ */
export type ThemeSetting = 'auto' | ThemeId;

export interface ThemeColors {
  bg: string;
  /** グラデーション背景を持つテーマの2色目(コントラスト検証にも使う) */
  bg2?: string;
  fg: string;
  fgSoft: string;
  circleBg: string;
  circleFg: string;
  ringFg: string;
}

/**
 * 各テーマのパレット。実際の描画は app.css の [data-theme] ブロックが担い、
 * ここの値はステータスバー色(theme-color)とテストでの検証に使う。
 * 値を変えるときは app.css と揃えること(themes.test.ts が同期を検証する)。
 */
export const THEMES: Record<ThemeId, { label: string; colors: ThemeColors }> = {
  night: {
    label: 'よぞら',
    colors: {
      bg: '#10182a',
      fg: '#d5deed',
      fgSoft: '#9dabc4',
      circleBg: '#27395c',
      circleFg: '#e2eaf6',
      ringFg: '#aebfd8'
    }
  },
  sea: {
    label: 'うみ',
    colors: {
      bg: '#e7f0f3',
      fg: '#1f4552',
      fgSoft: '#486976',
      circleBg: '#a7cbd8',
      circleFg: '#173741',
      ringFg: '#2e5866'
    }
  },
  forest: {
    label: 'もり',
    colors: {
      bg: '#f6f4ef',
      fg: '#33403c',
      fgSoft: '#5a6a65',
      circleBg: '#a7c4bc',
      circleFg: '#223330',
      ringFg: '#33403c'
    }
  },
  sunset: {
    label: 'ゆうやけ',
    colors: {
      bg: '#f4e0d3',
      bg2: '#e3d3e6',
      fg: '#54303f',
      fgSoft: '#734f5e',
      circleBg: '#e0b7a4',
      circleFg: '#4c2b39',
      ringFg: '#6d4455'
    }
  },
  moon: {
    label: 'つきあかり',
    colors: {
      bg: '#1d1c23',
      fg: '#d9d4e2',
      fgSoft: '#a59eb3',
      circleBg: '#3b3550',
      circleFg: '#e4deee',
      ringFg: '#b6accb'
    }
  },
  cloud: {
    label: 'くも',
    colors: {
      bg: '#f2f3f5',
      fg: '#3d444d',
      fgSoft: '#5f6873',
      circleBg: '#d3d9e0',
      circleFg: '#333a42',
      ringFg: '#4c545e'
    }
  }
};

/**
 * おまかせ: 時間帯で自動選択する。
 * 朝(5-9時)=うみ、昼(10-15時)=もり、夕方(16-18時)=ゆうやけ、夜(19-4時)=よぞら。
 * app.html のちらつき防止スクリプトにも同じ判定があるため、変更時は揃えること。
 */
export function resolveAutoTheme(hour: number): ThemeId {
  if (hour >= 5 && hour < 10) return 'sea';
  if (hour >= 10 && hour < 16) return 'forest';
  if (hour >= 16 && hour < 19) return 'sunset';
  return 'night';
}
