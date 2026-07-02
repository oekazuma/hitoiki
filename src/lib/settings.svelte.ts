import type { BreathingPattern } from './breathing/types';
import { clampPattern, DEFAULT_PRESET_ID, PRESETS, type PresetId } from './breathing/presets';

export const STORAGE_KEY = 'hitoiki:settings:v1';

export interface SettingsData {
	presetId: PresetId;
	custom: BreathingPattern;
	vibration: boolean;
}

const PRESET_IDS: readonly PresetId[] = ['gentle', 'four78', 'box', 'custom'];

function defaultData(): SettingsData {
	return {
		presetId: DEFAULT_PRESET_ID,
		custom: { ...PRESETS[0].pattern },
		vibration: false
	};
}

function isPattern(value: unknown): value is BreathingPattern {
	if (typeof value !== 'object' || value === null) return false;
	const p = value as Record<string, unknown>;
	return (['inhale', 'holdIn', 'exhale', 'holdOut'] as const).every(
		(key) => typeof p[key] === 'number' && Number.isFinite(p[key])
	);
}

export function loadSettings(storage: Pick<Storage, 'getItem'> | null): SettingsData {
	const fallback = defaultData();
	if (!storage) return fallback;
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw) as Partial<SettingsData>;
		return {
			presetId: PRESET_IDS.includes(parsed.presetId as PresetId)
				? (parsed.presetId as PresetId)
				: fallback.presetId,
			custom: isPattern(parsed.custom) ? clampPattern(parsed.custom) : fallback.custom,
			vibration: parsed.vibration === true
		};
	} catch {
		return fallback;
	}
}

export function saveSettings(storage: Pick<Storage, 'setItem'> | null, data: SettingsData): void {
	if (!storage) return;
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// プライベートモードや容量超過では保存せず動作を続ける
	}
}

function getLocalStorage(): Storage | null {
	try {
		if (typeof localStorage !== 'undefined') return localStorage;
	} catch {
		// アクセス自体が拒否される環境がある
	}
	return null;
}

export function createSettings(storage: Storage | null = getLocalStorage()) {
	const data = $state<SettingsData>(loadSettings(storage));

	function persist(): void {
		saveSettings(storage, $state.snapshot(data));
	}

	return {
		get presetId() {
			return data.presetId;
		},
		get custom() {
			return data.custom;
		},
		get vibration() {
			return data.vibration;
		},
		selectPreset(id: Exclude<PresetId, 'custom'>): void {
			const preset = PRESETS.find((p) => p.id === id);
			if (!preset) return;
			data.presetId = id;
			data.custom = { ...preset.pattern };
			persist();
		},
		updateCustom(patch: Partial<BreathingPattern>): void {
			data.custom = clampPattern({ ...data.custom, ...patch });
			data.presetId = 'custom';
			persist();
		},
		setVibration(v: boolean): void {
			data.vibration = v;
			persist();
		}
	};
}

export type Settings = ReturnType<typeof createSettings>;
