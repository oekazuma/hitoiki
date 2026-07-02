import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('メイン画面', () => {
	it('はじめるボタンで開始し、とめるボタンで停止する', async () => {
		const user = userEvent.setup();
		render(Page);

		await user.click(screen.getByRole('button', { name: 'はじめる' }));
		expect(screen.getByRole('button', { name: 'とめる' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('すって');

		await user.click(screen.getByRole('button', { name: 'とめる' }));
		expect(screen.getByRole('button', { name: 'はじめる' })).toBeInTheDocument();
	});
});
