import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { matchingQueries } from '../../vitest-setup';
import BreathingCircle from './BreathingCircle.svelte';

describe('BreathingCircle', () => {
  afterEach(() => {
    matchingQueries.clear();
  });

  it('停止中は「タップではじめる」と表示する', () => {
    render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: false });
    expect(screen.getAllByText('タップではじめる').length).toBeGreaterThan(0);
  });

  it('実行中はフェーズ名を表示する', () => {
    render(BreathingCircle, { phase: 'exhale', phaseProgress: 0.5, running: true });
    expect(screen.getAllByText('はいて').length).toBeGreaterThan(0);
  });

  it('リードイン(ready)中は「そのまま」と表示し円は静止する', () => {
    const { container } = render(BreathingCircle, { phase: 'ready', phaseProgress: 0.5, running: true });
    expect(screen.getAllByText('そのまま').length).toBeGreaterThan(0);
    const circle = container.querySelector('.circle') as HTMLElement;
    expect(circle.style.transform).toBe('scale(0.72)');
  });

  it('静止時のスケールは 0.72(穏やかな振幅)', () => {
    const { container } = render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: false });
    const circle = container.querySelector('.circle') as HTMLElement;
    expect(circle.style.transform).toBe('scale(0.72)');
  });

  it('実行中はフェーズ名を aria-live 領域で通知する', () => {
    render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: true });
    expect(screen.getByRole('status')).toHaveTextContent('すって');
  });

  it('停止中は aria-live 領域を空にする', () => {
    render(BreathingCircle, { phase: 'inhale', phaseProgress: 0, running: false });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('prefers-reduced-motion 時は静止スケールを 0.92 にする', () => {
    matchingQueries.add('(prefers-reduced-motion: reduce)');
    const { container } = render(BreathingCircle, {
      phase: 'inhale',
      phaseProgress: 0,
      running: false
    });
    const circle = container.querySelector('.circle') as HTMLElement;
    expect(circle.style.transform).toBe('scale(0.92)');
  });
});
