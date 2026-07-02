<script lang="ts">
	import { BreathingEngine } from '$lib/breathing/engine';
	import type { PhaseName } from '$lib/breathing/types';
	import { createSettings } from '$lib/settings.svelte';
	import BreathingCircle from '$lib/components/BreathingCircle.svelte';
	import ControlBar from '$lib/components/ControlBar.svelte';

	const settings = createSettings();
	const engine = new BreathingEngine();

	let engineState = $state(engine.state);
	let sheetOpen = $state(false);
	let rafId = 0;
	let wakeLock: WakeLockSentinel | null = null;

	function frame(now: number) {
		engineState = engine.tick(now);
		rafId = requestAnimationFrame(frame);
	}

	function startGuide() {
		engine.start({ ...settings.custom }, performance.now());
		engineState = engine.state;
		rafId = requestAnimationFrame(frame);
		void acquireWakeLock();
	}

	function stopGuide() {
		cancelAnimationFrame(rafId);
		engine.stop();
		engineState = engine.state;
		void releaseWakeLock();
	}

	async function acquireWakeLock() {
		try {
			if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
		} catch {
			wakeLock = null; // 非対応・拒否時はスリープ防止なしで動作する
		}
	}

	async function releaseWakeLock() {
		try {
			await wakeLock?.release();
		} catch {
			// すでに解放済みなら何もしない
		}
		wakeLock = null;
	}

	// 設定変更は次サイクルの頭から反映する
	$effect(() => {
		engine.setPattern({ ...settings.custom });
	});

	// フェーズ切替時の振動(設定オン かつ 対応端末のみ)
	let prevPhase: PhaseName = engine.state.phase;
	$effect(() =>
		engine.subscribe((s) => {
			if (s.running && s.phase !== prevPhase && settings.vibration && 'vibrate' in navigator) {
				navigator.vibrate(30);
			}
			prevPhase = s.phase;
		})
	);

	// 画面復帰時に Wake Lock を取り直す
	$effect(() => {
		const onVisibility = () => {
			if (document.visibilityState === 'visible' && engineState.running) void acquireWakeLock();
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	$effect(() => () => cancelAnimationFrame(rafId));
</script>

<svelte:head>
	<title>ひといき</title>
	<meta name="description" content="呼吸に意識を向けるためのガイド" />
</svelte:head>

<main class="app" class:running={engineState.running}>
	<button class="settings-button" onclick={() => (sheetOpen = true)}>せってい</button>
	<BreathingCircle
		phase={engineState.phase}
		phaseProgress={engineState.phaseProgress}
		running={engineState.running}
	/>
	<ControlBar running={engineState.running} onstart={startGuide} onstop={stopGuide} />
</main>

<style>
	.app {
		min-height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		justify-items: center;
		align-items: center;
		padding: 1rem 1rem calc(2rem + env(safe-area-inset-bottom));
	}

	.settings-button {
		justify-self: end;
		padding: 0.5rem 1rem;
		color: var(--fg-soft);
		transition: opacity 0.4s;
	}

	/* 実行中は視界のノイズを減らす */
	.running .settings-button {
		opacity: 0.35;
	}
</style>
