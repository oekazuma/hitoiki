<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { PHASE_LABELS, type PhaseName } from '$lib/breathing/types';

	let {
		phase,
		phaseProgress,
		running
	}: { phase: PhaseName; phaseProgress: number; running: boolean } = $props();

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	const RING_RADIUS = 56;
	const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

	const restScale = $derived(reducedMotion.current ? 0.92 : 0.6);

	const scale = $derived.by(() => {
		if (!running) return restScale;
		const eased = 0.5 - 0.5 * Math.cos(Math.PI * phaseProgress);
		if (phase === 'inhale') return restScale + (1 - restScale) * eased;
		if (phase === 'exhale') return 1 - (1 - restScale) * eased;
		if (phase === 'holdIn') return 1;
		return restScale;
	});

	const label = $derived(running ? PHASE_LABELS[phase] : 'ひといき');
	const dashOffset = $derived(running ? CIRCUMFERENCE * phaseProgress : CIRCUMFERENCE);
</script>

<div class="guide">
	<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
		<circle class="ring-track" cx="60" cy="60" r={RING_RADIUS} />
		<circle
			class="ring-progress"
			cx="60"
			cy="60"
			r={RING_RADIUS}
			stroke-dasharray={CIRCUMFERENCE}
			stroke-dashoffset={dashOffset}
		/>
	</svg>
	<div class="circle" aria-hidden="true" style:transform="scale({scale})"></div>
	<p class="label" aria-hidden="true">{label}</p>
</div>
<p class="visually-hidden" role="status" aria-live="polite">{running ? label : ''}</p>

<style>
	.guide {
		position: relative;
		width: min(72vw, 320px);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
	}

	.ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.ring-track,
	.ring-progress {
		fill: none;
		stroke-width: 3;
	}

	.ring-track {
		stroke: var(--ring-track);
	}

	.ring-progress {
		stroke: var(--ring-fg);
		stroke-linecap: round;
	}

	.circle {
		width: 78%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--circle-bg);
		will-change: transform;
	}

	.label {
		position: absolute;
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--circle-fg);
	}
</style>
